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

// Mostrar token en logs
console.log("Token de Mercado Pago:", process.env.ACCESS_TOKEN);

if (!process.env.ACCESS_TOKEN) {
  console.error("❌ ERROR: No se encontró ACCESS_TOKEN en el archivo .env");
  process.exit(1);
}

// ✅ Nueva forma de inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});

// ✅ Crear preferencia
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
        success: "https://numiscol.com/success",
        failure: "https://numiscol.com/failure",
        pending: "https://numiscol.com/pending",
      },
      auto_return: "approved",
    };

    const response = await preference.create({ body: preferenceData });

    res.json({
      preference_id: response.id,
      init_point: response.init_point,
    });

  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: error.message });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor MercadoPago corriendo en el puerto ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("✅ Backend de Numicol funcionando correctamente");
});