import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(express.json());
app.use(cors());

console.log("Token de Mercado Pago:", process.env.ACCESS_TOKEN);

if (!process.env.ACCESS_TOKEN) {
  console.error("❌ ERROR: No se encontró ACCESS_TOKEN en el archivo .env");
  process.exit(1);
}

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});

app.post("/create_preference", async (req, res) => {
  try {
    const { title, quantity, price, description, image } = req.body;

    if (!title || !quantity || !price) {
      return res.status(400).json({ error: "Faltan datos obligatorios (title, quantity, price)" });
    }

    const preference = new Preference(client);

    const preferenceData = {
      items: [
        {
          title,
          description: description || "Moneda coleccionable",
          quantity,
          currency_id: "COP",
          unit_price: parseFloat(price),
          picture_url: image || null,
        },
      ],
      back_urls: {
        success: "https://numicol-backend.onrender.com/success",
        failure: "https://numicol-backend.onrender.com/failure",
        pending: "https://numicol-backend.onrender.com/pending",
      },
      auto_return: "approved",
    };

    const response = await preference.create({ body: preferenceData });

    res.json({
      preference_id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });

  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend de Numicol funcionando correctamente");
});

// ✅ Rutas de confirmación
app.get("/success", (req, res) => res.send("✅ Pago aprobado correctamente."));
app.get("/failure", (req, res) => res.send("❌ El pago falló."));
app.get("/pending", (req, res) => res.send("⌛ Pago pendiente de confirmación."));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor MercadoPago corriendo en el puerto ${PORT}`);
});