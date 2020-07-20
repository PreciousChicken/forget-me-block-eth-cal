const CalStore = artifacts.require('CalStore');
contract('CalStore', async accounts => {
    it('should store a value', async () => {
        // assert.equal("Hi", "Hi", 'The value hi was not stored.');
        const calStoreInstance = await CalStore.new();
        // Get stored value
        const storedData = await calStoreInstance.justSayHi();
        assert.equal(storedData, "Hi", 'The value hi was not stored.');
    });
});
