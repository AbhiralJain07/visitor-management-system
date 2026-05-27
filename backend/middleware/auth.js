const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Token lo request ke header se
        const token = req.headers.authorization.split(' ')[1];
        
        // Token verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // User ki info request mein add karo
        req.user = decoded;
        
        // Aage jaao
        next();
        
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Pehle login karo!'
        });
    }
};

module.exports = auth;