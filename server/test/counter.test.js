const db = require('../helpers/database');
const Counter = require('../modules/Counter');

test('Test counter.mount', async () => {
    const spy = jest.spyOn(db, "q").mockImplementation(() => [[]]);
    const counter = await Counter.mount();
    expect(counter.result()).toStrictEqual({campaigns: []});
    
    spy.mockRestore();
});