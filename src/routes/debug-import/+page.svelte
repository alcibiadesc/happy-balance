<script lang="ts">
  let file: File | null = null;
  let result: any = null;
  let loading = false;
  let error = '';

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    file = target.files?.[0] || null;
    result = null;
    error = '';
  }

  async function testImport() {
    if (!file) {
      error = 'Please select a file';
      return;
    }

    loading = true;
    error = '';
    result = null;

    try {
      console.log('Starting import test with file:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', 'a524e6f2-647f-498f-beda-e710ff2a9423');
      formData.append('overwriteExisting', 'false');

      console.log('Making API call to /api/transactions/import');
      
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error Response:', errorText);
        error = `HTTP ${response.status}: ${errorText}`;
        return;
      }

      const jsonResult = await response.json();
      console.log('Success response:', jsonResult);
      result = jsonResult;

    } catch (err) {
      console.error('Import error:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  function createTestFile() {
    const csvContent = `Booking Date,Partner Name,Amount (EUR),Payment reference
2023-12-01,Test Shop,-10.50,TEST-REF-001
2023-12-02,Salary,2000.00,SALARY-DEC`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    file = new File([blob], 'test-import.csv', { type: 'text/csv' });
    error = '';
    result = null;
  }
</script>

<svelte:head>
  <title>Debug Import - Happy Balance</title>
</svelte:head>

<div class="container mx-auto p-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-8">Import Debug Tool</h1>
  
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <p class="text-yellow-800">
      <strong>Instructions:</strong> This page helps debug the CSV import functionality. 
      Open browser console (F12) to see detailed logs.
    </p>
  </div>

  <div class="space-y-6">
    <!-- File Selection -->
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">1. File Selection</h2>
      
      <div class="space-y-4">
        <button 
          onclick={createTestFile}
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Test CSV File
        </button>
        
        <p class="text-sm text-gray-600">Or upload your own CSV file:</p>
        
        <input 
          type="file" 
          accept=".csv"
          onchange={handleFileChange}
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
        />
        
        {#if file}
          <p class="text-sm text-green-600">✓ Selected: {file.name} ({file.size} bytes)</p>
        {/if}
      </div>
    </div>

    <!-- Import Test -->
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">2. Test Import</h2>
      
      <button 
        onclick={testImport}
        disabled={!file || loading}
        class="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Importing...' : 'Test Import'}
      </button>
    </div>

    <!-- Results -->
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">3. Results</h2>
      
      {#if loading}
        <div class="text-blue-600">
          <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Processing...
        </div>
      {/if}

      {#if error}
        <div class="bg-red-50 border border-red-200 rounded p-4">
          <h3 class="font-semibold text-red-800 mb-2">Error:</h3>
          <pre class="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      {/if}

      {#if result}
        <div class="bg-green-50 border border-green-200 rounded p-4">
          <h3 class="font-semibold text-green-800 mb-2">Success:</h3>
          <pre class="text-green-700 text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      {/if}
    </div>

    <!-- Console Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-semibold text-blue-800 mb-2">Console Monitoring:</h3>
      <p class="text-blue-700 text-sm">
        1. Open browser developer tools (F12)<br>
        2. Go to the Console tab<br>
        3. Click "Test Import" above<br>
        4. Watch for detailed logs and any error messages
      </p>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>