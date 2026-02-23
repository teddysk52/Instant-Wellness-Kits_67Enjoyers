import { Router } from "express";
import multer from "multer";
import {
  getOrders,
  getOrder,
  getStats,
  createOrder,
  importOrders,
  deleteOrder,
  deleteAllOrders,
} from "../controllers/orders";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.get("/stats", getStats);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.post("/import", upload.single("file"), importOrders);
router.post("/", createOrder);
router.delete("/:id", deleteOrder);
router.delete("/", deleteAllOrders);

export default router;
