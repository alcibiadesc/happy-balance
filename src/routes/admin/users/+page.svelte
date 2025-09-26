<script lang="ts">
  import { onMount } from 'svelte';
  import { Users, Plus, Edit2, Trash2, RefreshCw, Shield, User, Eye, X } from 'lucide-svelte';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/atoms/Button.svelte';
  import Input from '$lib/components/atoms/Input.svelte';
  import Badge from '$lib/components/atoms/Badge.svelte';

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
      const response = await fetch('http://localhost:3004/api/admin/users', {
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

      const response = await fetch('http://localhost:3004/api/admin/users', {
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
        successMessage = `User created! Password: ${result.data.tempPassword}`;
      } else {
        successMessage = 'User created successfully!';
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
      const response = await fetch(`http://localhost:3004/api/admin/users/${user.id}`, {
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

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`http://localhost:3004/api/admin/users/${userId}`, {
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

  async function resetPassword(userId: string) {
    if (!confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    loading = true;
    error = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch('http://localhost:3004/api/admin/users/reset-password', {
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
      alert(`Password reset successful. New password: ${result.tempPassword}`);
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

  function handleCreateUserClick() {
    console.log('Create User button clicked, current state:', showCreateModal);
    showCreateModal = true;
    console.log('New state:', showCreateModal);
  }

  function closeModal() {
    console.log('Closing modal');
    showCreateModal = false;
  }
</script>

<svelte:head>
  <title>User Management - Happy Balance</title>
</svelte:head>

{#if !authStore.isLoading && authStore.isAdmin}
  <div class="page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">Manage user accounts and permissions</p>
      </div>
      <Button
        variant="primary"
        onclick={handleCreateUserClick}
        disabled={loading}
      >
        <Plus size={16} strokeWidth={2} />
        Add User
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
          <span>Loading users...</span>
        </div>
      {:else}
        {#if users.length === 0}
          <div class="empty-state">
            <div class="empty-icon">
              <Users size={48} strokeWidth={1} />
            </div>
            <h3>No users found</h3>
            <p>No users are currently available to display. Try creating a new user or check your permissions.</p>
            <Button variant="outline" onclick={handleCreateUserClick}>
              <Plus size={16} />
              Create User
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
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div class="user-actions">
                  {#if editingUser?.id === user.id}
                    <Button variant="primary" size="sm" onclick={() => updateUser(user)}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onclick={() => editingUser = null}>
                      Cancel
                    </Button>
                  {:else}
                    <Button variant="ghost" size="sm" onclick={() => editingUser = user}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onclick={() => resetPassword(user.id)}>
                      <RefreshCw size={14} />
                    </Button>
                    {#if user.id !== authStore.currentUser?.id}
                      <Button variant="ghost" size="sm" onclick={() => deleteUser(user.id)}>
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
              Create New User
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
                Username * (3-50 characters)
              </label>
              <input
                bind:value={newUser.username}
                placeholder="Enter username (min 3 chars)"
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
                  Username must be at least 3 characters
                </p>
              {/if}
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem;">
                Password * (6-100 characters)
              </label>
              <input
                type="password"
                bind:value={newUser.password}
                placeholder="Enter password (min 6 chars)"
                required
                minlength="6"
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
              {#if newUser.password && newUser.password.length < 6}
                <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #dc2626;">
                  Password must be at least 6 characters
                </p>
              {/if}
            </div>

            <div style="margin-bottom: 2rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem;">
                Role
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
                <option value="user">User - Can view and edit own data</option>
                <option value="viewer">Viewer - Read-only access</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !newUser.username || !newUser.password || newUser.username.length < 3 || newUser.password.length < 6}
                style="
                  padding: 0.75rem 1.5rem;
                  background: #059669;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 500;
                  transition: all 0.2s;
                  opacity: {loading || !newUser.username || !newUser.password || newUser.username.length < 3 || newUser.password.length < 6 ? '0.5' : '1'};
                "
              >
{loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
{:else if authStore.isLoading}
  <div class="loading">
    <div class="spinner"></div>
    Loading...
  </div>
{:else}
  <div class="unauthorized">
    <h1>Unauthorized</h1>
    <p>You don't have permission to access this page.</p>
    <Button onclick={() => goto('/')}>
      Go Home
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
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .user-details {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .user-actions {
      align-self: stretch;
      justify-content: flex-end;
    }
  }
</style>