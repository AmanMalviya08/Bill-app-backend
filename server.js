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
const branchRoutes = require('./routes/branchRoutes'); // Add this

dotenv.config();

// Check for Mongo URI
if (!process.env.MONGO_URI) {
  console.error("❌ Error: MONGO_URI is not defined in .env file.");
  process.exit(1);
}

// Connect to DB
connectDB();

// App setup
const app = express();

// Enable CORS for all origins (for development purposes)
app.use(cors());
  
// app.use(cors({
//   origin: 'https://bill-app-frontend.netlify.app',
//   credentials: true
// }));

app.use(cors({
  origin: '*',
  credentials: true
}));


app.use(express.json());
app.use(morgan('dev'));

// ✅ Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/categories', categoryRoutes);

app.use('/api/companies/:companyId/branches', (req, res, next) => {
  req.companyId = req.params.companyId; // ✅ Pass companyId down
  next();
}, branchRoutes);


// ✅ Invoice routes nested under company and branch
app.use('/api/companies/:companyId/branches/:branchId/invoices', invoiceRoutes);

// Root test
app.get('/', (req, res) => {
  res.status(200).send('🚀 Billing System API is running...');
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at: http://localhost:${PORT}`);
});