
jest.setTimeout(10000);


require('dotenv').config({ path: '.env.test' });


console.log = jest.fn();
console.error = jest.fn();


afterEach(() => {
  jest.clearAllMocks();
});