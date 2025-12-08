<script lang="ts">
  import { onMount } from 'svelte';
  import { Users, Plus, X, Shield, User, Eye, Edit2, Trash2, RefreshCw } from 'lucide-svelte';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { goto } from '$app/navigation';
  import { t } from '$lib/stores/i18n';
  import { getApiUrl } from '$lib/utils/api-url';

  // Components
  import PageContainer from '$lib/components/atoms/PageContainer.svelte';
  import PageHeader from '$lib/components/molecules/PageHeader.svelte';
  import Button from '$lib/components/atoms/Button.svelte';
  import Badge from '$lib/components/atoms/Badge.svelte';
  import CreateUserModal from '$lib/components/organisms/CreateUserModal.svelte';
  import ConfirmationModal from '$lib/components/molecules/ConfirmationModal.svelte';

  // Types
  interface UserDTO {
    id: string;
    username: string;
    displayName: string;
    role: 'admin' | 'user' | 'viewer';
    isActive: boolean;
  }

  // State
  let users = $state<UserDTO[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let showCreateModal = $state(false);
  let editingUserId = $state<string | null>(null);
  let editName = $state('');

  // Confirmation modal state
  let confirmModal = $state({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Auth check
  $effect(() => {
    if (!authStore.isLoading && !authStore.isAdmin) {
      goto('/');
    }
  });

  onMount(() => {
    loadUsers();
  });

  // API Functions
  async function loadUsers() {
    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${getApiUrl()}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to load users: ${response.statusText}`);
      const data = await response.json();
      users = data.data || data.users || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load users';
    } finally {
      loading = false;
    }
  }

  async function handleCreateUser(userData: {
    username: string;
    password: string;
    role: 'admin' | 'user' | 'viewer';
  }) {
    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${getApiUrl()}/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          role: userData.role,
          tempPassword: userData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create user: ${response.status}`);
      }

      const result = await response.json();
      const tempPassword = result.data?.tempPassword || result.tempPassword;

      successMessage = tempPassword
        ? $t('admin.users.user_created_with_password', { password: tempPassword })
        : $t('admin.users.user_created');

      showCreateModal = false;
      await loadUsers();
      autoHideSuccess(8000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create user';
    } finally {
      loading = false;
    }
  }

  async function updateUser(user: UserDTO) {
    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${getApiUrl()}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: editName,
          role: user.role,
          isActive: user.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      editingUserId = null;
      await loadUsers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update user';
    } finally {
      loading = false;
    }
  }

  async function deleteUser(userId: string, username: string) {
    confirmModal = {
      isOpen: true,
      title: $t('admin.users.delete_user_title'),
      message: $t('admin.users.delete_user_message', { username }),
      action: async () => {
        loading = true;
        try {
          const token = authStore.getAccessToken();
          const response = await fetch(`${getApiUrl()}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to delete user');
          await loadUsers();
        } catch (err) {
          error = err instanceof Error ? err.message : 'Failed to delete user';
        } finally {
          loading = false;
        }
      },
    };
  }

  async function resetPassword(userId: string, username: string) {
    confirmModal = {
      isOpen: true,
      title: $t('admin.users.reset_password_title'),
      message: $t('admin.users.reset_password_message', { username }),
      action: async () => {
        loading = true;
        try {
          const token = authStore.getAccessToken();
          const response = await fetch(`${getApiUrl()}/admin/users/reset-password`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          if (!response.ok) throw new Error('Failed to reset password');

          const result = await response.json();
          const tempPassword = result.data?.tempPassword || result.tempPassword;
          successMessage = $t('admin.users.password_reset', { username, password: tempPassword });
          autoHideSuccess(10000);
        } catch (err) {
          error = err instanceof Error ? err.message : 'Failed to reset password';
        } finally {
          loading = false;
        }
      },
    };
  }

  async function toggleUserStatus(user: UserDTO) {
    loading = true;
    try {
      const token = authStore.getAccessToken();
      const newStatus = !user.isActive;

      const response = await fetch(`${getApiUrl()}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: user.role, isActive: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update user status');

      successMessage = newStatus
        ? $t('admin.users.user_activated', { username: user.username })
        : $t('admin.users.user_deactivated', { username: user.username });
      autoHideSuccess(3000);
      await loadUsers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update user status';
    } finally {
      loading = false;
    }
  }

  // Helper Functions
  function getRoleVariant(role: string): 'danger' | 'info' | 'warning' | 'default' {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'user':
        return 'info';
      case 'viewer':
        return 'warning';
      default:
        return 'default';
    }
  }

  function startEdit(user: UserDTO) {
    editingUserId = user.id;
    editName = user.displayName;
  }

  function cancelEdit() {
    editingUserId = null;
    editName = '';
  }

  function autoHideSuccess(delay: number) {
    setTimeout(() => {
      successMessage = null;
    }, delay);
  }

  function handleConfirm() {
    confirmModal.action();
    confirmModal.isOpen = false;
  }
</script>

<svelte:head>
  <title>{$t('admin.users.title')} - Happy Balance</title>
</svelte:head>

{#if !authStore.isLoading && authStore.isAdmin}
  <PageContainer>
    <PageHeader title={$t('admin.users.title')} subtitle={$t('admin.users.subtitle')}>
      <Button variant="primary" onclick={() => (showCreateModal = true)} disabled={loading}>
        <Plus size={16} />
        {$t('admin.users.add_user')}
      </Button>
    </PageHeader>

    <!-- Notifications -->
    {#if error}
      <div class="notification error">
        <span>{error}</span>
        <button class="notification-close" onclick={() => (error = null)}>
          <X size={16} />
        </button>
      </div>
    {/if}

    {#if successMessage}
      <div class="notification success">
        <span>{successMessage}</span>
        <button class="notification-close" onclick={() => (successMessage = null)}>
          <X size={16} />
        </button>
      </div>
    {/if}

    <!-- Content -->
    <div class="content">
      {#if loading && users.length === 0}
        <div class="loading-state">
          <div class="spinner"></div>
          <span>{$t('admin.users.loading')}</span>
        </div>
      {:else if users.length === 0}
        <div class="empty-state">
          <Users size={48} strokeWidth={1} />
          <h3>{$t('admin.users.no_users')}</h3>
          <p>{$t('admin.users.no_users_desc')}</p>
          <Button variant="outline" onclick={() => (showCreateModal = true)}>
            <Plus size={16} />
            {$t('admin.users.create_user_button')}
          </Button>
        </div>
      {:else}
        <div class="users-list">
          {#each users as user (user.id)}
            <div class="user-card" class:inactive={!user.isActive}>
              <div class="user-avatar">
                {user.displayName.charAt(0).toUpperCase()}
              </div>

              <div class="user-info">
                {#if editingUserId === user.id}
                  <input type="text" class="edit-input" bind:value={editName} />
                {:else}
                  <div class="user-name">{user.displayName}</div>
                {/if}
                <div class="user-details">
                  <span class="username">@{user.username}</span>
                  <Badge variant={getRoleVariant(user.role)} size="sm">
                    {#if user.role === 'admin'}<Shield size={12} />
                    {:else if user.role === 'viewer'}<Eye size={12} />
                    {:else}<User size={12} />{/if}
                    {user.role}
                  </Badge>
                  <Badge variant={user.isActive ? 'success' : 'warning'} size="sm">
                    {user.isActive ? $t('admin.users.active') : $t('admin.users.inactive')}
                  </Badge>
                </div>
              </div>

              <div class="user-actions">
                {#if editingUserId === user.id}
                  <Button variant="ghost" size="sm" onclick={cancelEdit}
                    >{$t('common.cancel')}</Button
                  >
                  <Button variant="primary" size="sm" onclick={() => updateUser(user)}
                    >{$t('common.save')}</Button
                  >
                {:else}
                  <Button variant="ghost" size="sm" onclick={() => startEdit(user)}
                    ><Edit2 size={14} /></Button
                  >
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => resetPassword(user.id, user.username)}
                    ><RefreshCw size={14} /></Button
                  >
                  <Button variant="ghost" size="sm" onclick={() => toggleUserStatus(user)}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      {#if user.isActive}
                        <path d="M10 9V6a4 4 0 1 1 8 0v3" /><rect
                          x="2"
                          y="9"
                          width="20"
                          height="12"
                          rx="2"
                        />
                      {:else}
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path
                          d="M7 11V7a5 5 0 0 1 10 0v4"
                        />
                      {/if}
                    </svg>
                  </Button>
                  {#if user.id !== authStore.currentUser?.id}
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => deleteUser(user.id, user.username)}
                      ><Trash2 size={14} /></Button
                    >
                  {/if}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Modals -->
    <CreateUserModal
      isOpen={showCreateModal}
      {loading}
      onSave={handleCreateUser}
      onCancel={() => (showCreateModal = false)}
    />

    <ConfirmationModal
      isOpen={confirmModal.isOpen}
      title={confirmModal.title}
      message={confirmModal.message}
      variant="danger"
      confirmText={$t('admin.users.confirm')}
      onConfirm={handleConfirm}
      onCancel={() => (confirmModal.isOpen = false)}
    />
  </PageContainer>
{:else if authStore.isLoading}
  <div class="loading-page">
    <div class="spinner"></div>
    {$t('common.loading')}
  </div>
{:else}
  <div class="unauthorized">
    <h1>{$t('admin.users.unauthorized_title')}</h1>
    <p>{$t('admin.users.unauthorized_message')}</p>
    <Button onclick={() => goto('/')}>{$t('admin.users.go_home')}</Button>
  </div>
{/if}

<style>
  /* Notifications */
  .notification {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    animation: slideDown 0.3s ease;
  }

  .notification.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: var(--text-primary);
  }

  .notification.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: var(--text-primary);
  }

  .notification-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .notification-close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Content */
  .content {
    background: var(--surface);
    border-radius: 1rem;
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .loading-state,
  .loading-page {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 4rem 2rem;
    color: var(--text-secondary);
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Users List */
  .users-list {
    padding: 0;
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    transition: background 0.2s;
  }

  .user-card:hover {
    background: var(--surface-muted);
  }

  .user-card:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
  }

  .user-card.inactive {
    opacity: 0.6;
  }

  .user-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, var(--primary), var(--acapulco));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .user-details {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .username {
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-family: monospace;
  }

  .edit-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--primary);
    border-radius: 6px;
    font-size: 0.9375rem;
    background: var(--surface);
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .user-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-muted);
  }

  .empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 1rem 0 0.5rem;
  }

  .empty-state p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  /* Unauthorized */
  .unauthorized {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 2rem;
  }

  .unauthorized h1 {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .unauthorized p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .user-card {
      flex-wrap: wrap;
      padding: 1rem;
    }

    .user-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }
  }

  @media (max-width: 480px) {
    .user-avatar {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.875rem;
    }

    .user-name {
      font-size: 0.875rem;
    }
  }
</style>
