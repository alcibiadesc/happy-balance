<script lang="ts">
  import { Edit2, Trash2, Eye, Lock, Unlock } from 'lucide-svelte';
  import Button from '$lib/components/atoms/Button.svelte';
  import Badge from '$lib/components/atoms/Badge.svelte';
  import { t } from '$lib/stores/i18n';

  interface User {
    id: string;
    username: string;
    displayName: string;
    role: 'admin' | 'user' | 'viewer';
    isActive: boolean;
  }

  interface Props {
    user: User;
    isCurrentUser: boolean;
    isEditing: boolean;
    onEdit: () => void;
    onSaveEdit: (name: string) => void;
    onCancelEdit: () => void;
    onToggleStatus: () => void;
    onResetPassword: () => void;
    onDelete: () => void;
  }

  let {
    user,
    isCurrentUser,
    isEditing,
    onEdit,
    onSaveEdit,
    onCancelEdit,
    onToggleStatus,
    onResetPassword,
    onDelete,
  }: Props = $props();

  let editName = $state(user.displayName);

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

  function handleSave() {
    onSaveEdit(editName);
  }

  $effect(() => {
    editName = user.displayName;
  });
</script>

<div class="user-card" class:inactive={!user.isActive}>
  <div class="user-avatar">
    {user.displayName.charAt(0).toUpperCase()}
  </div>

  <div class="user-info">
    {#if isEditing}
      <input type="text" class="edit-input" bind:value={editName} />
    {:else}
      <div class="user-name">{user.displayName}</div>
    {/if}
    <div class="user-details">
      <span class="username">@{user.username}</span>
      {#if user.role === 'admin'}
        <Badge variant={getRoleVariant(user.role)} size="sm">
          {$t('admin.users.role_admin')}
        </Badge>
      {:else if user.role === 'viewer'}
        <Badge variant={getRoleVariant(user.role)} size="sm">
          <Eye size={12} />
          {$t('admin.users.role_viewer')}
        </Badge>
      {:else}
        <Badge variant={getRoleVariant(user.role)} size="sm">
          {$t('admin.users.role_user')}
        </Badge>
      {/if}
      {#if !user.isActive}
        <Badge variant="default" size="sm">{$t('admin.users.inactive')}</Badge>
      {/if}
    </div>
  </div>

  <div class="user-actions">
    {#if isEditing}
      <Button variant="ghost" size="sm" onclick={onCancelEdit}>
        {$t('common.cancel')}
      </Button>
      <Button variant="primary" size="sm" onclick={handleSave}>
        {$t('common.save')}
      </Button>
    {:else}
      <Button variant="ghost" size="sm" onclick={onEdit}>
        <Edit2 size={14} />
      </Button>
      <Button variant="ghost" size="sm" onclick={onResetPassword}>
        <Lock size={14} />
      </Button>
      <Button variant="ghost" size="sm" onclick={onToggleStatus}>
        {#if user.isActive}
          <Unlock size={14} />
        {:else}
          <Lock size={14} />
        {/if}
      </Button>
      {#if !isCurrentUser}
        <Button variant="ghost" size="sm" onclick={onDelete}>
          <Trash2 size={14} />
        </Button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .user-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    transition: all 0.15s ease;
  }

  .user-card:hover {
    border-color: var(--primary);
  }

  .user-card.inactive {
    opacity: 0.6;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--acapulco));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    font-size: 1rem;
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

  .edit-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.2);
  }

  .user-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .user-card {
      flex-wrap: wrap;
    }

    .user-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }
  }
</style>
