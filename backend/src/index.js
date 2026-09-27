require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Employee Attrition Backend API Gateway`);
  console.log(`Running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
  console.log(`Ready for requests at: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
