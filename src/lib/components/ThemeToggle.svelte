<script>
	import { Sun, Moon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	
	let currentTheme = $state('japanese');
	
	function toggleTheme() {
		const newTheme = currentTheme === 'japanese' ? 'japanese-dark' : 'japanese';
		currentTheme = newTheme;
		document.documentElement.setAttribute('data-theme', newTheme);
		localStorage.setItem('theme', newTheme);
	}
	
	onMount(() => {
		// Obtener el tema actual del HTML
		const theme = document.documentElement.getAttribute('data-theme');
		currentTheme = theme || 'japanese';
	});
</script>

<label class="swap swap-rotate btn btn-ghost btn-circle">
	<input 
		type="checkbox" 
		checked={currentTheme === 'japanese-dark'}
		on:change={toggleTheme}
		aria-label="Cambiar tema"
	/>
	
	<!-- sun icon -->
	<div class="swap-on">
		<Moon size={20} />
	</div>
	
	<!-- moon icon -->
	<div class="swap-off">
		<Sun size={20} />
	</div>
</label>
