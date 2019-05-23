const db = require('../helpers/database');
const Counter = require('../modules/Counter');

test('Test counter.mount and add', async () => {
    const spy = jest.spyOn(db, "q")
        .mockImplementationOnce(() => [[{
            id: 1,
            title: 'TEST',
            candidates: '[{"id": 1, "name": "candidate 1"}, {"id": 2, "name": "candidate 2"}]', 
            start_date: new Date('2019-05-17 00:00:00'), 
            end_date: new Date('2020-05-17 00:00:00'),
        }]])
        .mockImplementationOnce(() => [[
            {campaign_id: 1, user_id: 1, candidate_id: 1},
            {campaign_id: 1, user_id: 2, candidate_id: 1},
            {campaign_id: 1, user_id: 3, candidate_id: 1},
            {campaign_id: 1, user_id: 4, candidate_id: 1},
            {campaign_id: 1, user_id: 5, candidate_id: 1},
            {campaign_id: 1, user_id: 6, candidate_id: 1},
            {campaign_id: 1, user_id: 7, candidate_id: 1},
            {campaign_id: 1, user_id: 8, candidate_id: 1},
            {campaign_id: 1, user_id: 9, candidate_id: 2},
        ]])
        .mockImplementationOnce(() => [[{
            id: 1,
            idcard: 'Y0000000',
        }]])
        .mockImplementationOnce(() => [[]])
        .mockImplementationOnce(() => []);
    
    const counter = await Counter.mount();
    let result = counter.result();
    expect(result.campaigns[0].candidates[0].votes).toStrictEqual(8);
    expect(result.campaigns[0].candidates[1].votes).toStrictEqual(1);
    
    await counter.add(1, 'Y1111111', 2);
    result = counter.result();
    expect(result.campaigns[0].candidates[1].votes).toStrictEqual(2);
    
    spy.mockRestore();
});