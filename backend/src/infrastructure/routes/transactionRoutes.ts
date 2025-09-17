import { Router } from "express";
import { TransactionController } from "../controllers/TransactionController";

export const createTransactionRoutes = (
  transactionController: TransactionController,
): Router => {
  const router = Router();

  // Transaction CRUD operations
  router.post(
    "/",
    transactionController.createTransaction.bind(transactionController),
  );
  router.get(
    "/",
    transactionController.getTransactions.bind(transactionController),
  );
  router.get(
    "/statistics",
    transactionController.getStatistics.bind(transactionController),
  );
  router.get(
    "/dashboard",
    transactionController.getDashboard.bind(transactionController),
  );
  router.delete(
    "/",
    transactionController.deleteAll.bind(transactionController),
  );

  // Smart categorization route
  router.post(
    "/:id/categorize",
    transactionController.smartCategorizeTransaction.bind(transactionController),
  );

  router.get(
    "/:id",
    transactionController.getTransaction.bind(transactionController),
  );
  router.put(
    "/:id",
    transactionController.updateTransaction.bind(transactionController),
  );
  router.delete(
    "/:id",
    transactionController.deleteTransaction.bind(transactionController),
  );

  return router;
};
