const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const branchRoutes = require('./routes/branchRoutes');

dotenv.config();

// ✅ Ensure MONGO_URI
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not set");
  process.exit(1);
}

// ✅ Connect DB
connectDB();

// ✅ App setup
const app = express();

// ✅ Define allowed origins
const allowedOrigins = ['https://sensational-brioche-dc91e2.netlify.app'];

// ✅ Custom CORS logic
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    // Production site
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // Allow all in development (no credentials)
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Middleware
app.use(express.json());
app.use(morgan('dev'));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/categories', categoryRoutes);

app.use('/api/companies/:companyId/branches', (req, res, next) => {
  req.companyId = req.params.companyId;
  next();
}, branchRoutes);

app.use('/api/companies/:companyId/branches/:branchId/invoices', invoiceRoutes);

// ✅ Root route
app.get('/', (req, res) => {
  res.status(200).send('🚀 Billing System API is running...');
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ✅ Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
