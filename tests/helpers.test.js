const { 
    hasIncreasedFor,
    hasDecreasedFor,
    getChangePercentage
} = require('../src/helpers');

describe('helpers', ()=>{
    describe('hasIncreasedFor(current, initial, percent)', ()=>{
        describe('when increased percentage reached', ()=>{
            test('returns true', ()=>{
                const initial = '0.37840';
                const percent = '0.0250';
                const current = initial * '1.0250';

                expect(hasIncreasedFor(current, initial, percent)).toBe(true);
            });
        });
    });
    
    describe('hasDecreasedFor(current, initial, percent)', ()=>{
        describe('when increased percentage reached', ()=>{
            test('returns true', ()=>{
                const initial = '0.37840';
                const percent = '0.0250';
                const current = initial * '0.9750';

                expect(hasDecreasedFor(current, initial, percent)).toBe(true);
            });
        });
    });

    describe('getChangePercentage(initial, current)', ()=>{
        describe('when current value increased', ()=>{
            test('returns positive increased percentage', ()=>{
                const initial = '0.37840';
                const percent = '0.0250';
                const current = initial * '1.0250';

                expect(getChangePercentage(initial, current)).toBe(percent);
            });
        });
    });
});
