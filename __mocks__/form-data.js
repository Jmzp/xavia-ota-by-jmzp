module.exports = jest.fn().mockImplementation(() => ({
  append: jest.fn(),
  getHeaders: jest.fn(() => ({})),
  submit: jest.fn(),
  pipe: jest.fn(),
}));
