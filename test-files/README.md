# Test Files for Excel Compare App

This directory contains sample Excel files to test the comparison functionality.

## How to Test

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Upload two Excel files**:
   - Create two Excel files with some differences
   - Or use the sample files below

## Sample Test Scenarios

### Basic Comparison
- Create `file1.xlsx` with some data
- Create `file2.xlsx` with the same data but some cells changed
- Upload both files and compare

### Formula Changes
- Create files with formulas like `=A1+B1`
- Change formulas in one file
- Compare to see formula differences

### Sheet Differences
- Create files with different sheet names
- Add/remove sheets between files
- Compare to see sheet-level changes

### Cell Addition/Removal
- Add new rows/columns in one file
- Delete rows/columns in one file
- Compare to see structural changes

## Expected Results

The app should:
- Parse both Excel files correctly
- Identify all differences (added, removed, changed cells)
- Display results in a clear, organized format
- Show formulas when toggled
- Provide summary statistics

## Troubleshooting

If you encounter issues:
1. Check the browser console for errors
2. Ensure Excel files are valid (.xlsx or .xls format)
3. Verify the development server is running
4. Check that all dependencies are installed
