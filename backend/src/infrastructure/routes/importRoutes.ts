import { Router } from 'express';
import { ImportController } from '../controllers/ImportController';
import { upload } from '../middleware/upload';

export const createImportRoutes = (importController: ImportController): Router => {
  const router = Router();

  // Log all requests to import routes
  router.use((req, res, next) => {
    console.log(`🔍 Import route: ${req.method} ${req.path}`);
    next();
  });

  // Import operations
  router.post('/csv', upload.single('file'), importController.importFromCsv.bind(importController));
  router.post('/check-duplicates', importController.checkDuplicates.bind(importController));
  router.post('/selected', importController.importSelected.bind(importController));
  router.post('/excel', upload.single('file'), importController.importFromExcel.bind(importController));
  router.post('/preview', upload.single('file'), importController.previewCsv.bind(importController));
  router.post('/validate', upload.single('file'), importController.validateCsv.bind(importController));
  router.get('/history', importController.getImportHistory.bind(importController));

  return router;
};