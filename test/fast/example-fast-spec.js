describe("Example test set", function() {
    it("should have written tests",function(){
        expect(false).toBe(true);
        expect(Ext.Date.format(new Date(),'Y')).toEqual('2013');
    });
    
    it('should render the app', function() {
        var app = Rally.test.Harness.launchApp("CArABU.app.TSApp");
        expect(app.getEl()).toBeDefined();
    });
    
});
