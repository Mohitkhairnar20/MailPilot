const express = require("express");
const {
  getContacts,
  createContact,
  updateContact,
  deleteContact
} = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getContacts);
router.post("/", createContact);
router.put("/:contactId", updateContact);
router.delete("/:contactId", deleteContact);

module.exports = router;
