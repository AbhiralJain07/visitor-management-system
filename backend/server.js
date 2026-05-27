const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const visitorRoutes = require('./routes/visitors');
const visitRoutes = require('./routes/visits'); 
const employeeRoutes = require('./routes/employees');
const officeRoutes = require('./routes/offices');
const authRoutes = require('./routes/auth');

app.use('/api/visitors', visitorRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/auth', authRoutes);


// Test route
app.get('/', (req, res) => {
    res.send('VMS Server chal raha hai! 🚀');
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Database connected! ✅');
    })
    .catch((error) => {
        console.log('Database error:', error);
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} pe chal raha hai! 🚀`);
});