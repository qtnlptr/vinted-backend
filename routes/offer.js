const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const User = require("../models/User");
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/publish", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.body;

    /// Création de la nouvelle offre
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user,
    });
    /// J'upload l'image sur Cloudinary avec le chemin souhaité
    const pictureToUpload = convertToBase64(req.files.picture);
    const productImage = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `vinted/offers/${newOffer._id}`,
    });
    /// J'ajoute la photo dans l'annonce
    newOffer.product_image = productImage;
    await newOffer.save();
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/// Route pour filtrer les annonces : 10 par pages, si la page n'existe pas renvoyer la page 1.
router.get("", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;
    // Pagination
    let limit = 10;
    let skip = 0;
    if (page) {
      skip = (page - 1) * limit;
    }
    // Tri
    let sorting;
    if (sort) {
      sorting = { product_price: sort.replace("price-", "") };
    }

    // Je crée un objet que je vais remplir en fonction des paramètres que je reçois. Il me servira pour filtrer ensuite.
    let filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin || priceMax) {
      filters.product_price = {};
      if (priceMin) {
        filters.product_price.$gte = priceMin;
      }
      if (priceMax) {
        filters.product_price.$lte = priceMax;
      }
    }

    const query = await Offer.find(filters)
      .sort(sorting)
      .skip(skip)
      .limit(limit);

    const result = {
      count: query.length,
      offers: query,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/publish/:id", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    /// Je trouve l'offre à modifier
    const offerToModify = await Offer.findById(req.params.id).populate(
      "owner",
      "_id account"
    );

    /// Si elle n'existe pas, j'envoie un message d'erreur
    if (!offerToModify) {
      return res.status(400).json({ message: "Offer does not exist" });
    }

    // Je déstructure mon req.body
    const { title, description, price, condition, city, brand, size, color } =
      req.body;

    /// Je supprime la photo existante
    const public_id = offerToModify.product_image.public_id;
    await cloudinary.uploader.destroy(public_id);

    /// J'écrase les données de l'offre et je les remplace avec les nouvelles (même si aucun changement)
    offerToModify.product_name = title;
    offerToModify.product_description = description;
    offerToModify.product_price = price;
    offerToModify.product_details[0].MARQUE = brand;
    offerToModify.product_details[1].TAILLE = size;
    offerToModify.product_details[2].ÉTAT = condition;
    offerToModify.product_details[3].COULEUR = color;
    offerToModify.product_details[4].EMPLACEMENT = city;

    /// J'upload de nouveau la photo de l'offre MAJ envoyée
    const pictureToUpload = convertToBase64(req.files.picture);
    const productImage = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `vinted/offers/${offerToModify._id}`,
    });
    /// Je remplace la photo dans la nouvelle offre
    offerToModify.product_image = productImage;

    return res.status(200).json(offerToModify);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/publish/:id", async (req, res) => {
  try {
    const offerToDelete = await Offer.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const offerDetails = await Offer.findById(req.params.id);
    if (!offerDetails) {
      return res.status(400).json({ message: "Offer does not exist" });
    }
    return res.status(200).json(offerDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
