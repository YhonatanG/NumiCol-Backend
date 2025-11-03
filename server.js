import express from "express";
import mercadopago from "mercadopago";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Obtener ruta base del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(express.json());
app.use(cors());

// Verificar que el token se está leyendo correctamente
console.log("Token de Mercado Pago:", process.env.MERCADOPAGO_ACCESS_TOKEN);

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.error("❌ ERROR: No se encontró MERCADOPAGO_ACCESS_TOKEN en el archivo .env");
  process.exit(1);
}

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ✅ Ruta para crear una preferencia y mostrar los detalles del producto
app.post("/create_preference", async (req, res) => {
  try {
    const { title, quantity, price, description, image } = req.body;

    if (!title || !quantity || !price) {
      return res.status(400).json({ error: "Faltan datos obligatorios (title, quantity, price)" });
    }

    // Crear el objeto de preferencia
    const preference = {
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
        success: "http://localhost:3000/success",
        failure: "http://localhost:3000/failure",
        pending: "http://localhost:3000/pending",
      },
      auto_return: "approved",
    };

    // Crear preferencia en Mercado Pago
    const response = await mercadopago.preferences.create(preference);

    // Mostrar los detalles de la moneda
    const detallesMoneda = {
      titulo: title,
      cantidad: quantity,
      precio_unitario: price,
      total: quantity * price,
      descripcion: description || "Moneda coleccionable",
      imagen: image || "Sin imagen",
      preference_id: response.body.id,
    };

    console.log("🪙 Detalles de la moneda:", detallesMoneda);

    // Enviar respuesta al frontend
    res.json(detallesMoneda);
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: error.message });
  }
});

// Servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor MercadoPago corriendo en http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('✅ Backend de Numicol funcionando correctamente');
});
