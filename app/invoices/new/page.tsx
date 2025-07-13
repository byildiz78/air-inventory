Here's the fixed version with the missing closing brackets and parentheses added:

The main issues were:

1. Missing closing bracket and parenthesis in the `loadData` function's Promise.all call
2. Missing closing bracket for the entire component

Here are the fixes (adding at the appropriate locations):

```javascript
// In the loadData function, after Promise.resolve(mockWarehouses)
const loadData = async () => {
    try {
      setLoading(true); 
      const [materialsData, suppliersData, unitsData, taxesData] = await Promise.all([
        materialService.getAll(),
        supplierService.getAll(),
        unitService.getAll(),
        taxService.getAll(),
        Promise.resolve(mockWarehouses)
      ]); // Added closing bracket and parenthesis here
      setMaterials(materialsData);
      setSuppliers(suppliersData);
      setUnits(unitsData);
      setTaxes(taxesData);
      setWarehouses(mockWarehouses);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
};
```

And at the very end of the file, add the final closing brace:

```javascript
  );
} // Added closing brace for the NewInvoicePage component
```

These additions complete the syntax and make the code valid JavaScript/React.