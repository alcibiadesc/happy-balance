<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { Edit3, Check, X } from 'lucide-svelte';
  
  interface Props {
    value?: string;
    placeholder?: string;
    maxLength?: number;
    isEditing?: boolean;
  }
  
  let { value = '', placeholder = 'Agregar descripción...', maxLength = 200, isEditing = false }: Props = $props();
  
  const dispatch = createEventDispatcher();
  
  let editedValue = $state(value);
  let inputElement: HTMLInputElement | HTMLTextAreaElement;
  
  // Auto-save after user stops typing for 2 seconds
  let saveTimeout: number;
  
  // Update isMultiline based on content length
  let isMultiline = $derived(editedValue.length > 50 || editedValue.includes('\n'));
  
  function startEditing() {
    isEditing = true;
    editedValue = value;
    tick().then(() => {
      inputElement?.focus();
      inputElement?.select();
    });
  }
  
  function cancelEditing() {
    isEditing = false;
    editedValue = value;
  }
  
  function saveValue() {
    if (editedValue !== value) {
      dispatch('save', editedValue.trim());
    }
    isEditing = false;
  }
  
  function handleInput() {
    // Auto-save with debounce
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (editedValue !== value && editedValue.trim() !== '') {
        dispatch('save', editedValue.trim());
      }
    }, 2000);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !isMultiline) {
      e.preventDefault();
      saveValue();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }
  
  function handleBlur() {
    // Small delay to allow for click on save/cancel buttons
    setTimeout(() => {
      if (isEditing) {
        saveValue();
      }
    }, 150);
  }
</script>

<div class="inline-text-editor">
  {#if isEditing}
    <!-- Editing State -->
    <div class="flex items-start gap-2">
      {#if isMultiline}
        <textarea
          bind:this={inputElement}
          bind:value={editedValue}
          {placeholder}
          {maxLength}
          class="input-editorial text-sm resize-none min-h-[2.5rem] max-h-32"
          rows="2"
          oninput={handleInput}
          onkeydown={handleKeydown}
          onblur={handleBlur}
        ></textarea>
      {:else}
        <input
          bind:this={inputElement}
          bind:value={editedValue}
          type="text"
          {placeholder}
          {maxLength}
          class="input-editorial text-sm"
          oninput={handleInput}
          onkeydown={handleKeydown}
          onblur={handleBlur}
        />
      {/if}
      
      <!-- Action buttons for explicit save/cancel -->
      <div class="flex gap-1 mt-1">
        <button
          class="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
          onclick={saveValue}
          title="Guardar"
        >
          <Check class="w-3 h-3" />
        </button>
        <button
          class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
          onclick={cancelEditing}
          title="Cancelar"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>
    
    <div class="text-xs text-gray-400 mt-1">
      {editedValue.length}/{maxLength} • Enter para guardar, Esc para cancelar
    </div>
  {:else}
    <!-- Display State -->
    <button
      class="group flex items-center gap-2 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2 py-1 -mx-2 -my-1 transition-all duration-150 min-h-[1.5rem] w-full max-w-xs"
      onclick={startEditing}
    >
      <span class="truncate flex-1">
        {value || placeholder}
      </span>
      <Edit3 class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  {/if}
</div>

<style>
  .inline-text-editor {
    width: 100%;
    max-width: 20rem;
  }
</style>