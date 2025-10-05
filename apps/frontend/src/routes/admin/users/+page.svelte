<script lang="ts">
  import { onMount } from 'svelte';
  import { Users, Plus, Edit2, Trash2, RefreshCw, Shield, User, Eye, X } from 'lucide-svelte';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/atoms/Button.svelte';
  import Input from '$lib/components/atoms/Input.svelte';
  import Badge from '$lib/components/atoms/Badge.svelte';
  import { t } from '$lib/stores/i18n';
  import { getApiUrl } from '$lib/utils/api-url';

  interface UserDTO {
    id: string;
    username: string;
    displayName: string;
    role: 'admin' | 'user' | 'viewer';
    isActive: boolean;
    createdBy?: string;
    lastLogin?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  let users = $state<UserDTO[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let showCreateModal = $state(false);
  let editingUser = $state<UserDTO | null>(null);
  let successMessage = $state<string | null>(null);
  let confirmAction = $state<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ show: false, title: '', message: '', action: () => {} });

  // Create user form
  let newUser = $state({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user' | 'viewer'
  });

  // Check if user is admin
  $effect(() => {
    if (!authStore.isLoading && !authStore.isAdmin) {
      goto('/');
    }
  });

  onMount(() => {
    loadUsers();
  });

  async function loadUsers() {
    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${getApiUrl()}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Users response:', data);
      users = data.data || data.users || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load users';
      console.error('Error loading users:', err);
    } finally {
      loading = false;
    }
  }

  async function createUser() {
    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      console.log('Creating user with data:', newUser);
      console.log('Using token:', token ? 'Token present' : 'No token');

      // For testing, let's try without authentication first
      if (!token) {
        console.log('No token found, trying without authentication...');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const requestData = {
        username: newUser.username,
        role: newUser.role,
        tempPassword: newUser.password || undefined // Only send if not empty
      };

      console.log('Sending request data:', requestData);

      const response = await fetch(`${getApiUrl()}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const responseText = await response.text();
        console.log('Error response text:', responseText);

        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `Failed to create user: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Failed to create user: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }

      const result = await response.json();
      console.log('User created successfully:', result);

      // Show success message
      if (result.data && result.data.tempPassword) {
        successMessage = $t('admin.users.user_created_with_password', { password: result.data.tempPassword });
      } else {
        successMessage = $t('admin.users.user_created');
      }

      // Auto-hide success message after 8 seconds
      setTimeout(() => {
        successMessage = null;
      }, 8000);

      // Reset form and reload users
      newUser = { username: '', password: '', role: 'user' };
      showCreateModal = false;
      await loadUsers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create user';
      console.error('Error creating user:', err);
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: user.displayName,
          role: user.role,
          isActive: user.isActive
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      editingUser = null;
      await loadUsers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update user';
      console.error('Error updating user:', err);
    } finally {
      loading = false;
    }
  }

  async function deleteUser(userId: string, username: string) {
    showConfirmation(
      $t('admin.users.delete_user_title'),
      $t('admin.users.delete_user_message', { username }),
      () => performDeleteUser(userId)
    );
  }

  async function performDeleteUser(userId: string) {

    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${getApiUrl()}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      await loadUsers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete user';
      console.error('Error deleting user:', err);
    } finally {
      loading = false;
    }
  }

  async function resetPassword(userId: string, username: string) {
    showConfirmation(
      $t('admin.users.reset_password_title'),
      $t('admin.users.reset_password_message', { username }),
      () => performResetPassword(userId, username)
    );
  }

  async function performResetPassword(userId: string, username: string) {

    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${getApiUrl()}/admin/users/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const result = await response.json();
      console.log('Reset password response:', result);

      // Handle different response formats
      const tempPassword = result.data?.tempPassword || result.tempPassword;
      successMessage = $t('admin.users.password_reset', { username, password: tempPassword });

      // Auto-hide success message after 10 seconds
      setTimeout(() => {
        successMessage = null;
      }, 10000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to reset password';
      console.error('Error resetting password:', err);
    } finally {
      loading = false;
    }
  }

  function getRoleVariant(role: string): 'danger' | 'info' | 'warning' | 'default' {
    switch (role) {
      case 'admin': return 'danger';
      case 'user': return 'info';
      case 'viewer': return 'warning';
      default: return 'default';
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'admin': return Shield;
      case 'user': return User;
      case 'viewer': return Eye;
      default: return User;
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  async function toggleUserStatus(user: UserDTO) {
    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const newStatus = !user.isActive;

      const response = await fetch(`${getApiUrl()}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: user.role,
          isActive: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }

      successMessage = newStatus
        ? $t('admin.users.user_activated', { username: user.username })
        : $t('admin.users.user_deactivated', { username: user.username });

      // Auto-hide success message
      setTimeout(() => {
        successMessage = null;
      }, 3000);

      await loadUsers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update user status';
      console.error('Error updating user status:', err);
    } finally {
      loading = false;
    }
  }

  function handleCreateUserClick() {
    console.log('Create User button clicked, current state:', showCreateModal);
    showCreateModal = true;
    console.log('New state:', showCreateModal);
  }

  function closeModal() {
    console.log('Closing modal');
    showCreateModal = false;
  }

  function showConfirmation(title: string, message: string, action: () => void) {
    confirmAction = {
      show: true,
      title,
      message,
      action
    };
  }

  function confirmYes() {
    confirmAction.action();
    confirmAction.show = false;
  }

  function confirmNo() {
    confirmAction.show = false;
  }
</script>

<svelte:head>
  <title>{$t('admin.users.title')} - Happy Balance</title>
</svelte:head>

{#if !authStore.isLoading && authStore.isAdmin}
  <div class="page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{$t('admin.users.title')}</h1>
        <p class="page-subtitle">{$t('admin.users.subtitle')}</p>
      </div>
      <Button
        variant="primary"
        onclick={handleCreateUserClick}
        disabled={loading}
      >
        <Plus size={16} strokeWidth={2} />
        {$t('admin.users.add_user')}
      </Button>
    </div>

    <!-- Notifications -->
    {#if error}
      <div class="notification error">
        <div class="notification-content">
          <span class="notification-text">{error}</span>
          <button onclick={() => error = null} class="notification-close">
            <X size={16} />
          </button>
        </div>
      </div>
    {/if}

    {#if successMessage}
      <div class="notification success">
        <div class="notification-content">
          <span class="notification-text">{successMessage}</span>
          <button onclick={() => successMessage = null} class="notification-close">
            <X size={16} />
          </button>
        </div>
      </div>
    {/if}

    <!-- Main Content -->
    <div class="content">
      {#if loading}
        <div class="loading-state">
          <div class="spinner"></div>
          <span>{$t('admin.users.loading')}</span>
        </div>
      {:else}
        {#if users.length === 0}
          <div class="empty-state">
            <div class="empty-icon">
              <Users size={48} strokeWidth={1} />
            </div>
            <h3>{$t('admin.users.no_users')}</h3>
            <p>{$t('admin.users.no_users_desc')}</p>
            <Button variant="outline" onclick={handleCreateUserClick}>
              <Plus size={16} />
              {$t('admin.users.create_user_button')}
            </Button>
          </div>
        {:else}
          <div class="users-grid">
            {#each users as user (user.id)}
              <div class="user-card">
                <div class="user-avatar">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                  <div class="user-name">{user.displayName}</div>
                  <div class="user-details">
                    <span class="username">@{user.username}</span>
                    <Badge variant={getRoleVariant(user.role)} size="sm">
                      {#if user.role === 'admin'}
                        <Shield size={12} />
                      {:else if user.role === 'user'}
                        <User size={12} />
                      {:else}
                        <Eye size={12} />
                      {/if}
                      {user.role}
                    </Badge>
                    <Badge variant={user.isActive ? 'success' : 'warning'} size="sm">
                      {user.isActive ? $t('admin.users.active') : $t('admin.users.inactive')}
                    </Badge>
                  </div>
                </div>
                <div class="user-actions">
                  {#if editingUser?.id === user.id}
                    <Button variant="primary" size="sm" onclick={() => updateUser(user)}>
                      {$t('admin.users.save')}
                    </Button>
                    <Button variant="ghost" size="sm" onclick={() => editingUser = null}>
                      {$t('common.cancel')}
                    </Button>
                  {:else}
                    <Button variant="ghost" size="sm" onclick={() => editingUser = user}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onclick={() => resetPassword(user.id, user.username)}>
                      <RefreshCw size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => toggleUserStatus(user)}
                      title={user.isActive ? $t('admin.users.deactivate_user') : $t('admin.users.activate_user')}
                    >
                      {#if user.isActive}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M10 9V6a4 4 0 1 1 8 0v3"/>
                          <rect x="2" y="9" width="20" height="12" rx="2" ry="2"/>
                        </svg>
                      {:else}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      {/if}
                    </Button>
                    {#if user.id !== authStore.currentUser?.id}
                      <Button variant="ghost" size="sm" onclick={() => deleteUser(user.id, user.username)}>
                        <Trash2 size={14} />
                      </Button>
                    {/if}
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Create User Modal - Simple Version -->
    {#if showCreateModal}
      <div
        style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        "
        onclick={closeModal}
      >
        <div
          style="
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            position: relative;
          "
          onclick={(e) => e.stopPropagation()}
        >
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 0.5rem;">
              {$t('admin.users.create_user')}
            </h2>
            <button
              onclick={closeModal}
              style="
                background: #f3f4f6;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 18px;
                color: #6b7280;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >×</button>
          </div>

          <!-- Form -->
          <form onsubmit={(e) => { e.preventDefault(); createUser(); }}>
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem;">
                {$t('admin.users.username')} {$t('admin.users.username_required')}
              </label>
              <input
                bind:value={newUser.username}
                placeholder={$t('admin.users.username_placeholder')}
                required
                minlength="3"
                maxlength="50"
                style="
                  width: 100%;
                  padding: 0.75rem;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  font-size: 0.875rem;
                  transition: border-color 0.2s;
                "
              />
              {#if newUser.username && newUser.username.length < 3}
                <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #dc2626;">
                  {$t('admin.users.username_min_error')}
                </p>
              {/if}
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem;">
                {$t('admin.users.password')} {$t('admin.users.password_required')}
              </label>
              <input
                type="password"
                bind:value={newUser.password}
                placeholder={$t('admin.users.password_placeholder')}
                required
                minlength="4"
                maxlength="100"
                style="
                  width: 100%;
                  padding: 0.75rem;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  font-size: 0.875rem;
                  transition: border-color 0.2s;
                "
              />
              {#if newUser.password && newUser.password.length < 4}
                <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #dc2626;">
                  {$t('admin.users.password_min_error')}
                </p>
              {/if}
            </div>

            <div style="margin-bottom: 2rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem;">
                {$t('admin.users.role')}
              </label>
              <select
                bind:value={newUser.role}
                style="
                  width: 100%;
                  padding: 0.75rem;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  font-size: 0.875rem;
                  background: white;
                "
              >
                <option value="user">{$t('admin.users.role_user')}</option>
                <option value="viewer">{$t('admin.users.role_viewer')}</option>
                <option value="admin">{$t('admin.users.role_admin')}</option>
              </select>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 0.5rem;">
              <button
                type="button"
                onclick={closeModal}
                style="
                  padding: 0.75rem 1.5rem;
                  background: #f9fafb;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 500;
                  color: #374151;
                  transition: all 0.2s;
                "
              >
                {$t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !newUser.username || !newUser.password || newUser.username.length < 3 || newUser.password.length < 4}
                style="
                  padding: 0.75rem 1.5rem;
                  background: #059669;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 500;
                  transition: all 0.2s;
                  opacity: {loading || !newUser.username || !newUser.password || newUser.username.length < 3 || newUser.password.length < 4 ? '0.5' : '1'};
                "
              >
                {loading ? $t('admin.users.creating') : $t('admin.users.add_user')}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Confirmation Modal -->
    {#if confirmAction.show}
      <div class="modal-overlay" onclick={confirmNo}>
        <div class="modal-content confirm-modal" onclick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">{confirmAction.title}</h2>
          </div>
          <div class="confirm-content">
            <p>{confirmAction.message}</p>
          </div>
          <div class="modal-actions">
            <Button variant="ghost" onclick={confirmNo}>
              {$t('common.cancel')}
            </Button>
            <Button variant="danger" onclick={confirmYes}>
              {$t('admin.users.confirm')}
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else if authStore.isLoading}
  <div class="loading">
    <div class="spinner"></div>
    {$t('common.loading')}
  </div>
{:else}
  <div class="unauthorized">
    <h1>{$t('admin.users.unauthorized_title')}</h1>
    <p>{$t('admin.users.unauthorized_message')}</p>
    <Button onclick={() => goto('/')}>
      {$t('admin.users.go_home')}
    </Button>
  </div>
{/if}

<style>
  .page {
    padding: 1.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .header-content {
    flex: 1;
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  /* Notifications */
  .notification {
    margin-bottom: 1.5rem;
    border-radius: 0.75rem;
    padding: 1rem;
    animation: slideDown 0.3s ease;
  }

  .notification.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .notification.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .notification-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .notification-close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
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

  .loading-state {
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
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Users Grid */
  .users-grid {
    padding: 0;
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    transition: background-color 0.2s ease;
    min-height: 5rem;
  }

  .user-card:hover {
    background: var(--surface-muted);
  }

  .user-card:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
  }

  .user-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    background: var(--evening-sea);
    color: var(--bridesmaid);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.125rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.15);
  }

  .user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .user-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .user-details {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .username {
    font-size: 0.875rem;
    color: var(--text-tertiary);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  }

  .user-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .empty-icon {
    color: var(--text-tertiary);
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  .empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1.5rem 0;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-xl);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .modal-close {
    background: var(--surface-muted);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: var(--surface);
    color: var(--text-primary);
  }

  .modal-form {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .required {
    color: var(--error);
  }

  .form-select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--surface);
    color: var(--text-primary);
    transition: border-color 0.2s ease;
  }

  .form-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }

  .form-error {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: var(--error);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
    margin-top: 0.5rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .confirm-modal {
    max-width: 400px;
  }

  .confirm-content {
    padding: 1.5rem;
    text-align: center;
  }

  .confirm-content p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .user-card {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto auto;
      grid-template-areas:
        "avatar name"
        "avatar details"
        "actions actions";
      gap: 0.5rem 1rem;
      padding: 1rem;
      align-items: start;
    }

    .user-avatar {
      grid-area: avatar;
      align-self: center;
    }

    .user-info {
      grid-area: name;
      align-self: center;
      min-width: 0;
    }

    .user-details {
      grid-area: details;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      min-width: 0;
    }

    .user-actions {
      grid-area: actions;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-start;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .user-actions :global(button) {
      flex: 1;
      min-width: 44px;
    }

    .modal-content {
      margin: 1rem;
      max-width: calc(100vw - 2rem);
    }

    .confirm-modal {
      max-width: calc(100vw - 2rem);
    }
  }

  @media (max-width: 480px) {
    .page {
      padding: 0.5rem;
    }

    .user-card {
      padding: 0.75rem;
    }

    .user-avatar {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.75rem;
    }

    .user-name {
      font-size: 0.875rem;
    }

    .username {
      font-size: 0.75rem;
    }

    .user-actions :global(button) {
      min-width: 40px;
      padding: 0.5rem;
    }
  }
</style>