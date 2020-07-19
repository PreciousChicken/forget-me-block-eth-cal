// SPDX-License-Identifier: MIT
pragma solidity ^0.6.1;
pragma experimental ABIEncoderV2;

contract CalStore  {

    struct VEvent {
        uint dtstamp;
        uint dtstart;
        uint duration;
        string summary;
        string description;
        uint uid; // This should by dtstart, plus an id, plus msg.owner Change to string eventually
    }

    VEvent[] private userVEvent;
    mapping(address => VEvent[]) private store;

    function storeEvent(uint _dtstamp, uint _dtstart, uint _duration, string memory _summary, string memory _description) public {
        VEvent[] memory currentData = store[msg.sender];
        uint nextId = currentData.length + 1;
        VEvent memory newData = VEvent(_dtstamp, _dtstart, _duration, _summary, _description, nextId);
        userVEvent.push(newData);
        store[msg.sender] = userVEvent;
    }
    function justSayHi() public pure returns (string memory) {
        return "Hi";
    }


    // Returns all msg for msg.sender, regardless of time
    function getEvents(address _calOwner) public view returns (VEvent[] memory) {
        VEvent[] memory tempData = store[_calOwner];
        return tempData;
    }
}

// CalStore.deployed().then(function(instance) {app = instance})
// app.storeEvent(1595170930, 1595171111, 33, "Deloitte Meeting", "Discuss new project");
// app.getEvents('0xD6733F5011732cfb46788549bb8342556E2D9096');
// app.justSayHi();
