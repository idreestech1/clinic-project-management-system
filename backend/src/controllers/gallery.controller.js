import { GalleryItem } from "../models/GalleryItem.js";

export const getGalleryItems = async (_req, res, next) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.json({ gallery: items.map((item) => item.toJSON()) });
  } catch (err) {
    next(err);
  }
};

export const createGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.create(req.body);
    res.status(201).json({ item: item.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      res.status(404).json({ message: "Gallery item not found." });
      return;
    }

    res.json({ item: item.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const deleteGalleryItem = async (req, res, next) => {
  try {
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
