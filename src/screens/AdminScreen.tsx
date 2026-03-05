import { useState, useEffect } from 'react';
import { Plus, Edit2, UserCheck, UserX, Building2, Users } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useStores } from '@/hooks/useStores';
import { useToast } from '@/hooks/useToast';
import PageHeader from '@/components/layout/PageHeader';
import PinPad from '@/components/ui/PinPad';
import type { User, Store, UserRole } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';

type AdminTab = 'users' | 'stores';

// ── User Modal ────────────────────────────────────────────────────────────────

interface UserFormData {
  name: string;
  email: string;
  pin: string;
  store_id: string;
  role: UserRole;
}

function validate(form: UserFormData, storeList: Store[]): string | null {
  if (form.name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
  if (!/^\d{4}$/.test(form.pin)) return 'PIN must be exactly 4 digits.';
  if (!form.store_id) return 'Please select a store.';
  if (!form.role) return 'Please select a role.';
  return null;
}

interface UserModalProps {
  user?: User | null;
  stores: Store[];
  onSave: (data: UserFormData) => Promise<void>;
  onClose: () => void;
}

function UserModal({ user, stores, onSave, onClose }: UserModalProps) {
  const [form, setForm] = useState<UserFormData>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    pin: '',
    store_id: user?.store_id ?? '',
    role: user?.role ?? 'floor_colleague',
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);

  const handleSubmit = async () => {
    const err = validate(form, stores);
    if (err) { setError(err); return; }
    setIsSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save user';
      setError(msg.includes('duplicate') ? 'Email already in use.' : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border-grey">
          <h2 className="text-lg font-bold text-navy">
            {user ? 'Edit User' : 'Add User'}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full border border-border-grey rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@primark.com"
              className="w-full border border-border-grey rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
            />
          </div>
          {/* Store */}
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-1">Store</label>
            <select
              value={form.store_id}
              onChange={(e) => setForm({ ...form, store_id: e.target.value })}
              className="w-full border border-border-grey rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
            >
              <option value="">Select store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full border border-border-grey rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
            >
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          {/* PIN */}
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-2">
              {user ? 'New PIN (leave blank to keep current)' : 'PIN'}
            </label>
            {showPinPad ? (
              <PinPad
                onComplete={(pin) => {
                  setForm({ ...form, pin });
                  setShowPinPad(false);
                }}
              />
            ) : (
              <button
                onClick={() => setShowPinPad(true)}
                className="w-full py-2.5 border-2 border-dashed border-border-grey rounded-xl text-sm text-mid-grey hover:border-primark-blue hover:text-primark-blue transition-colors"
              >
                {form.pin ? `PIN set: ****` : 'Tap to set PIN'}
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
        </div>
        <div className="p-5 border-t border-border-grey flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-border-grey rounded-xl text-charcoal font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 bg-primark-blue text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Store Modal ───────────────────────────────────────────────────────────────

interface StoreFormData {
  name: string;
  store_code: string;
  region: string;
}

interface StoreModalProps {
  store?: Store | null;
  onSave: (data: StoreFormData) => Promise<void>;
  onClose: () => void;
}

function StoreModal({ store, onSave, onClose }: StoreModalProps) {
  const [form, setForm] = useState<StoreFormData>({
    name: store?.name ?? '',
    store_code: store?.store_code ?? '',
    region: store?.region ?? '',
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (form.name.trim().length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (!form.store_code.trim()) { setError('Store code is required.'); return; }
    setIsSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save store';
      setError(msg.includes('duplicate') ? 'Store code already in use.' : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="p-5 border-b border-border-grey">
          <h2 className="text-lg font-bold text-navy">
            {store ? 'Edit Store' : 'Add Store'}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-1">Store Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Manchester Arndale"
              className="w-full border border-border-grey rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-1">Store Code</label>
            <input
              type="text"
              value={form.store_code}
              onChange={(e) => setForm({ ...form, store_code: e.target.value.toUpperCase() })}
              placeholder="e.g. MAN01"
              className="w-full border border-border-grey rounded-xl px-3 py-2.5 text-sm text-charcoal font-mono focus:outline-none focus:border-primark-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mid-grey uppercase tracking-wide mb-1">Region</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="e.g. North West"
              className="w-full border border-border-grey rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <div className="p-5 border-t border-border-grey flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-border-grey rounded-xl text-charcoal font-medium text-sm">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 bg-primark-blue text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Admin Screen ──────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { showToast } = useToast();
  const {
    users, isLoading: usersLoading, fetchAllUsers,
    createUser, updateUser, setUserActive, countActiveAdmins,
  } = useUsers();
  const {
    stores, isLoading: storesLoading, refetch: refetchStores,
    createStore, updateStore, setStoreActive,
  } = useStores(true);

  useEffect(() => {
    fetchAllUsers(showInactive);
  }, [showInactive, fetchAllUsers]);

  // ── User handlers ──
  const handleSaveUser = async (data: { name: string; email: string; pin: string; store_id: string; role: UserRole }) => {
    if (editingUser) {
      const update: Partial<User> = {
        name: data.name,
        email: data.email,
        store_id: data.store_id,
        role: data.role,
      };
      if (data.pin) update.pin = data.pin;
      await updateUser(editingUser.id, update);
      showToast('User updated.', 'success');
    } else {
      if (!data.pin) throw new Error('PIN is required for new users.');
      await createUser(data);
      showToast('User created.', 'success');
    }
    fetchAllUsers(showInactive);
    setEditingUser(null);
    setShowUserModal(false);
  };

  const handleToggleUser = async (user: User) => {
    if (user.is_active && user.role === 'admin') {
      const count = await countActiveAdmins();
      if (count <= 1) {
        showToast('Cannot deactivate the last admin user.', 'error');
        return;
      }
    }
    await setUserActive(user.id, !user.is_active);
    showToast(
      `${user.name} ${user.is_active ? 'deactivated' : 'activated'}.`,
      user.is_active ? 'warning' : 'success'
    );
    fetchAllUsers(showInactive);
  };

  // ── Store handlers ──
  const handleSaveStore = async (data: StoreFormData) => {
    if (editingStore) {
      await updateStore(editingStore.id, data);
      showToast('Store updated.', 'success');
    } else {
      await createStore(data);
      showToast('Store created.', 'success');
    }
    setEditingStore(null);
    setShowStoreModal(false);
  };

  const handleToggleStore = async (store: Store) => {
    await setStoreActive(store.id, !store.is_active);
    showToast(
      `${store.name} ${store.is_active ? 'deactivated' : 'activated'}.`,
      store.is_active ? 'warning' : 'success'
    );
    refetchStores();
  };

  const allStores = useStores(true).stores;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-light-grey">
      <PageHeader title="Admin" subtitle="User & store management" />

      {/* Tabs */}
      <div className="flex bg-white border-b border-border-grey">
        {(['users', 'stores'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-primark-blue text-primark-blue'
                : 'border-transparent text-mid-grey',
            ].join(' ')}
          >
            {tab === 'users' ? <Users size={16} /> : <Building2 size={16} />}
            {tab === 'users' ? 'Users' : 'Stores'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-mid-grey cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded"
                />
                Show inactive
              </label>
              <button
                onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-primark-blue text-white rounded-xl text-sm font-medium"
              >
                <Plus size={16} />
                Add User
              </button>
            </div>

            {usersLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={[
                      'bg-white rounded-xl px-4 py-3 flex items-center gap-3',
                      !u.is_active && 'opacity-50',
                    ].filter(Boolean).join(' ')}
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-navy text-sm truncate">{u.name}</p>
                        {!u.is_active && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 bg-border-grey text-mid-grey rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mid-grey truncate">{u.email}</p>
                      <p className="text-xs text-mid-grey">{ROLE_LABELS[u.role]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                        className="p-2 text-mid-grey hover:text-primark-blue transition-colors"
                        aria-label="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleUser(u)}
                        className={[
                          'p-2 transition-colors',
                          u.is_active ? 'text-mid-grey hover:text-danger' : 'text-mid-grey hover:text-success',
                        ].join(' ')}
                        aria-label={u.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-mid-grey text-sm py-8">No users found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Stores Tab ── */}
        {activeTab === 'stores' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                onClick={() => { setEditingStore(null); setShowStoreModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-primark-blue text-white rounded-xl text-sm font-medium"
              >
                <Plus size={16} />
                Add Store
              </button>
            </div>

            {storesLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {stores.map((s) => (
                  <div
                    key={s.id}
                    className={[
                      'bg-white rounded-xl px-4 py-3 flex items-center gap-3',
                      !s.is_active && 'opacity-50',
                    ].filter(Boolean).join(' ')}
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-navy text-sm truncate">{s.name}</p>
                        {!s.is_active && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 bg-border-grey text-mid-grey rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mid-grey font-mono">{s.store_code}</p>
                      {s.region && <p className="text-xs text-mid-grey">{s.region}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingStore(s); setShowStoreModal(true); }}
                        className="p-2 text-mid-grey hover:text-primark-blue transition-colors"
                        aria-label="Edit store"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStore(s)}
                        className={[
                          'p-2 transition-colors',
                          s.is_active ? 'text-mid-grey hover:text-danger' : 'text-mid-grey hover:text-success',
                        ].join(' ')}
                        aria-label={s.is_active ? 'Deactivate store' : 'Activate store'}
                      >
                        {s.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
                {stores.length === 0 && (
                  <p className="text-center text-mid-grey text-sm py-8">No stores found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          stores={allStores.filter((s) => s.is_active)}
          onSave={handleSaveUser}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
        />
      )}
      {showStoreModal && (
        <StoreModal
          store={editingStore}
          onSave={handleSaveStore}
          onClose={() => { setShowStoreModal(false); setEditingStore(null); }}
        />
      )}
    </div>
  );
}
