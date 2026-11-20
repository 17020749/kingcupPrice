<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import type { CatalogData, Product, ProductCategory, ProductVisual } from '~/types/product';

const props = defineProps<{
  open: boolean;
  products: Product[];
  categories: ProductCategory[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [catalog: CatalogData];
}>();

const authenticated = ref(false);
const configured = ref(false);
const loading = ref(false);
const saving = ref(false);
const password = ref('');
const error = ref('');
const notice = ref('');
const showForm = ref(false);
const editingId = ref<string | null>(null);
const imagePreview = ref('');

const categoryOptions = computed(() => props.categories.filter((item) => item.id !== 'all'));
const visualOptions: { value: ProductVisual; label: string }[] = [
  { value: 'box', label: 'Thùng / hộp' },
  { value: 'tape', label: 'Băng keo' },
  { value: 'film', label: 'Màng cuộn' },
  { value: 'pouch', label: 'Túi' },
  { value: 'bubble', label: 'Xốp hơi' },
  { value: 'bag', label: 'Bao bì' },
];

const draft = reactive({
  id: '',
  sku: '',
  name: '',
  categoryId: '',
  description: '',
  priceFrom: 0,
  unit: 'cái',
  minOrder: 1,
  leadTime: '2–4 ngày',
  visual: 'box' as ProductVisual,
  badge: '',
  imageUrl: '',
  file: null as File | null,
});

const editingLabel = computed(() => editingId.value ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới');

function clearPreview() {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
  imagePreview.value = '';
}

function resetDraft() {
  clearPreview();
  Object.assign(draft, {
    id: '',
    sku: '',
    name: '',
    categoryId: categoryOptions.value[0]?.id ?? '',
    description: '',
    priceFrom: 0,
    unit: 'cái',
    minOrder: 1,
    leadTime: '2–4 ngày',
    visual: 'box',
    badge: '',
    imageUrl: '',
    file: null,
  });
  editingId.value = null;
  showForm.value = false;
}

async function loadSession() {
  loading.value = true;
  error.value = '';
  try {
    const result = await $fetch<{ authenticated: boolean; configured: boolean }>('/api/admin/session');
    authenticated.value = result.authenticated;
    configured.value = result.configured;
    if (result.authenticated) resetDraft();
  } catch {
    error.value = 'Không thể kiểm tra trạng thái đăng nhập. Vui lòng tải lại trang.';
  } finally {
    loading.value = false;
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) await loadSession();
  else {
    password.value = '';
    error.value = '';
    notice.value = '';
  }
});

onBeforeUnmount(clearPreview);

async function login() {
  error.value = '';
  loading.value = true;
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } });
    password.value = '';
    authenticated.value = true;
    resetDraft();
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || cause?.data?.message || 'Mật khẩu không chính xác.';
  } finally {
    loading.value = false;
  }
}

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
  authenticated.value = false;
  resetDraft();
}

function startCreate() {
  resetDraft();
  draft.id = crypto.randomUUID();
  showForm.value = true;
  error.value = '';
  notice.value = '';
}

function startEdit(product: Product) {
  clearPreview();
  Object.assign(draft, {
    id: product.id,
    sku: product.sku,
    name: product.name,
    categoryId: product.categoryId,
    description: product.description,
    priceFrom: product.priceFrom,
    unit: product.unit,
    minOrder: product.minOrder,
    leadTime: product.leadTime,
    visual: product.visual,
    badge: product.badge ?? '',
    imageUrl: product.imageUrl ?? '',
    file: null,
  });
  editingId.value = product.id;
  showForm.value = true;
  error.value = '';
  notice.value = '';
}

function chooseImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  clearPreview();
  draft.file = file;
  if (file) imagePreview.value = URL.createObjectURL(file);
}

async function saveProduct() {
  error.value = '';
  notice.value = '';

  if (!draft.name.trim() || !draft.sku.trim()) {
    error.value = 'Vui lòng nhập tên sản phẩm và SKU.';
    return;
  }
  if (!Number.isFinite(draft.priceFrom) || draft.priceFrom < 0
    || !Number.isFinite(draft.minOrder) || draft.minOrder < 1) {
    error.value = 'Giá phải từ 0 trở lên và số lượng tối thiểu phải ít nhất là 1.';
    return;
  }
  if (draft.file && draft.file.size > 4 * 1024 * 1024) {
    error.value = 'Ảnh vượt quá 4 MB. Vui lòng nén ảnh trước khi tải lên.';
    return;
  }
  if (draft.file && !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(draft.file.type)) {
    error.value = 'Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc AVIF.';
    return;
  }
  const duplicateSku = props.products.some((item) =>
    item.sku.toLowerCase() === draft.sku.trim().toLowerCase() && item.id !== editingId.value);
  if (duplicateSku) {
    error.value = 'SKU đã được sử dụng bởi sản phẩm khác.';
    return;
  }

  saving.value = true;
  try {
    let imageUrl = draft.imageUrl;
    if (draft.file) {
      const formData = new FormData();
      formData.append('file', draft.file);
      const uploaded = await $fetch<{ url: string }>('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      imageUrl = uploaded.url;
    }

    const category = categoryOptions.value.find((item) => item.id === draft.categoryId);
    if (!category) throw new Error('Vui lòng chọn danh mục hợp lệ.');

    const product: Product = {
      id: draft.id || crypto.randomUUID(),
      sku: draft.sku.trim(),
      name: draft.name.trim(),
      categoryId: draft.categoryId,
      category: category.label,
      description: draft.description.trim(),
      priceFrom: Math.floor(Number(draft.priceFrom)),
      unit: draft.unit.trim() || 'cái',
      minOrder: Math.max(1, Math.floor(Number(draft.minOrder))),
      leadTime: draft.leadTime.trim() || 'Liên hệ',
      visual: draft.visual,
      ...(draft.badge.trim() ? { badge: draft.badge.trim() } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    };

    const nextProducts = editingId.value
      ? props.products.map((item) => item.id === editingId.value ? product : item)
      : [...props.products, product];

    const result = await $fetch<{ success: boolean; catalog: CatalogData }>('/api/admin/catalog', {
      method: 'PUT',
      body: { categories: props.categories, products: nextProducts },
    });

    emit('saved', result.catalog);
    resetDraft();
    notice.value = 'Đã lưu dữ liệu sản phẩm lên Vercel Blob.';
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || cause?.data?.message || cause?.message || 'Không thể lưu. Vui lòng thử lại.';
  } finally {
    saving.value = false;
  }
}

async function deleteProduct(product: Product) {
  if (!window.confirm('Xóa sản phẩm "' + product.name + '"?')) return;

  error.value = '';
  notice.value = '';
  saving.value = true;
  try {
    const result = await $fetch<{ success: boolean; catalog: CatalogData }>('/api/admin/catalog', {
      method: 'PUT',
      body: {
        categories: props.categories,
        products: props.products.filter((item) => item.id !== product.id),
      },
    });
    emit('saved', result.catalog);
    if (editingId.value === product.id) resetDraft();
    notice.value = 'Đã xóa sản phẩm. Ảnh cũ vẫn còn trong Blob để tránh xóa nhầm ảnh đang dùng.';
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || cause?.data?.message || 'Không thể xóa sản phẩm.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="admin-backdrop" @click.self="$emit('close')">
      <section class="admin-panel" role="dialog" aria-modal="true" aria-label="Quản trị Kingcup Price">
        <header class="admin-header">
          <div>
            <small>KINGCUP PRICE / ADMIN</small>
            <h2>Quản trị dữ liệu</h2>
          </div>
          <div class="admin-header-actions">
            <button v-if="authenticated" class="admin-logout" :disabled="saving" @click="logout">Đăng xuất</button>
            <button class="admin-close" aria-label="Đóng" @click="$emit('close')">×</button>
          </div>
        </header>

        <div v-if="loading" class="admin-state">Đang kiểm tra phiên đăng nhập...</div>

        <form v-else-if="!authenticated" class="admin-login" @submit.prevent="login">
          <div class="admin-lock">K.</div>
          <h3>Đăng nhập quản trị</h3>
          <p>Khu vực này chỉ dành cho người được cấp quyền quản lý dữ liệu.</p>
          <label>Mật khẩu quản trị</label>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required>
          <p v-if="!configured" class="admin-error">Máy chủ chưa cấu hình NUXT_ADMIN_PASSWORD và NUXT_ADMIN_SESSION_SECRET. Hãy thêm hai biến này trong Vercel trước khi đăng nhập.</p>
          <p v-if="error" class="admin-error">{{ error }}</p>
          <button class="admin-primary" type="submit" :disabled="loading || !configured">Đăng nhập</button>
        </form>

        <div v-else class="admin-content">
          <div class="admin-toolbar">
            <div>
              <b>{{ products.length }} sản phẩm</b>
              <span>Dữ liệu được lưu trong Blob Store</span>
            </div>
            <button class="admin-primary" :disabled="saving" @click="startCreate">＋ Thêm sản phẩm</button>
          </div>

          <p v-if="notice" class="admin-success">{{ notice }}</p>
          <p v-if="error" class="admin-error">{{ error }}</p>

          <form v-if="showForm" class="admin-product-form" @submit.prevent="saveProduct">
            <div class="admin-form-heading">
              <h3>{{ editingLabel }}</h3>
              <button type="button" class="admin-link-button" @click="resetDraft">Đóng biểu mẫu</button>
            </div>

            <div class="admin-form-grid">
              <label>Tên sản phẩm<input v-model="draft.name" maxlength="140" required></label>
              <label>Mã SKU<input v-model="draft.sku" maxlength="60" required></label>
              <label>Danh mục
                <select v-model="draft.categoryId" required>
                  <option v-for="item in categoryOptions" :key="item.id" :value="item.id">{{ item.label }}</option>
                </select>
              </label>
              <label>Kiểu minh họa
                <select v-model="draft.visual">
                  <option v-for="item in visualOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
              </label>
              <label>Giá tham khảo (VND)<input v-model.number="draft.priceFrom" type="number" min="0" step="1" required></label>
              <label>Đơn vị<input v-model="draft.unit" maxlength="24" required></label>
              <label>Số lượng tối thiểu<input v-model.number="draft.minOrder" type="number" min="1" step="1" required></label>
              <label>Thời gian giao hàng<input v-model="draft.leadTime" maxlength="50"></label>
              <label class="admin-wide">Mô tả<textarea v-model="draft.description" rows="2" maxlength="400"></textarea></label>
              <label class="admin-wide">Nhãn nổi bật<input v-model="draft.badge" maxlength="40" placeholder="Ví dụ: Được quan tâm"></label>
              <label class="admin-wide">Ảnh sản phẩm (JPG, PNG, WebP, AVIF — tối đa 4 MB)
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="chooseImage">
              </label>
            </div>

            <div v-if="imagePreview || draft.imageUrl" class="admin-image-preview">
              <img :src="imagePreview || draft.imageUrl" alt="Ảnh xem trước">
              <span>{{ draft.file?.name || 'Ảnh hiện tại' }}</span>
            </div>

            <div class="admin-form-actions">
              <button type="button" class="admin-secondary" @click="resetDraft">Hủy</button>
              <button class="admin-primary" type="submit" :disabled="saving">{{ saving ? 'Đang lưu...' : 'Lưu sản phẩm' }}</button>
            </div>
          </form>

          <div class="admin-product-list">
            <article v-for="product in products" :key="product.id" class="admin-product-row">
              <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name">
              <div v-else class="admin-product-placeholder">K.</div>
              <div class="admin-product-info">
                <b>{{ product.name }}</b>
                <span>{{ product.sku }} · {{ product.category }}</span>
                <small>{{ new Intl.NumberFormat('vi-VN').format(product.priceFrom) }} đ / {{ product.unit }}</small>
              </div>
              <div class="admin-row-actions">
                <button type="button" class="admin-secondary" :disabled="saving" @click="startEdit(product)">Sửa</button>
                <button type="button" class="admin-danger" :disabled="saving" @click="deleteProduct(product)">Xóa</button>
              </div>
            </article>
          </div>

          <p class="admin-footnote">Ảnh được lưu trên Public Blob; danh mục và sản phẩm được lưu trong catalog.json. Thay đổi dữ liệu không cần GitHub commit hoặc deploy lại.</p>
        </div>
      </section>
    </div>
  </Teleport>
</template>
