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

// ✅ Check for Mongo URI
if (!process.env.MONGO_URI) {
  console.error("❌ Error: MONGO_URI is not defined in .env file.");
  process.exit(1);
}

// ✅ Connect to DB
connectDB();

// ✅ App setup
const app = express();

// ✅ Enable CORS for specific origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://sensational-brioche-dc91e2.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Middleware
app.use(express.json());
app.use(morgan('dev'));

// ✅ Mount routes
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
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ✅ Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at: http://localhost:${PORT}`);
});
