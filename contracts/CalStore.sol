// SPDX-License-Identifier: MIT
pragma solidity ^0.6.1;
pragma experimental ABIEncoderV2;

import "./BokkyPooBahsDateTimeLibrary.sol";

contract CalStore  {
    using BokkyPooBahsDateTimeLibrary for uint;

    struct VEvent {
        uint dtstamp;
        uint dtstart;
        uint dtend;
        string summary;
        string description;
        uint uid; // This should by dtstart, plus an id, plus msg.owner Change to string eventually
    }

    // VEvent[] private userVEvent;
    mapping(address => VEvent[]) private store;

    function storeEvent(uint _dtstamp, uint _dtstart, uint _dtend, string memory _summary, string memory _description) public {
        // VEvent[] memory currentData = store[msg.sender];
        // uint nextId = currentData.length + 1;
        // VEvent[] memory currentData = store[msg.sender];
        uint nextId = store[msg.sender].length + 1;
        VEvent memory newEvent = VEvent(_dtstamp, _dtstart, _dtend, _summary, _description, nextId);
        store[msg.sender].push(newEvent);
    }
    function justSayHi() public pure returns (string memory) {
        return "Hi";
    }

    function removeEvent(uint _index) public {
        // Delete does not change the array length.
        // It resets the value at index to it's default value,
        // in this case 0
        VEvent[] memory currentData = store[msg.sender];
        delete currentData[_index];
    }

    function timestampToDateTime(uint timestamp) public pure returns (uint year, uint month, uint day, uint hour, uint minute, uint second) {
        (year, month, day, hour, minute, second) = BokkyPooBahsDateTimeLibrary.timestampToDateTime(timestamp);
    }

    /// @notice Returns iCal string of message senders previously stored data
    /// @dev TODO: Return if no events?
    /// @param _calOwner address of message sender
    /// @return string iCalendar string iaw RFC 5545
    function getEventsIcal(address _calOwner) public view returns (string memory) {
        string memory outputString = "";
        string memory vCalHeader = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//preciouschicken.com//forget-me-block-eth-cal\nCALSCALE:GREGORIAN\n";
        string memory vCalFooter = "END:VCALENDAR\n";
        VEvent[] memory ownerEvent = store[_calOwner];
        string memory ownerStr = addressToStr(_calOwner);

        for (uint i = 0; i < ownerEvent.length; i++) {
            // string memory dtstamp = ownerEvent[i].dtstamp;
            // string memory uid = ownerEvent[i].uid;
            // string memory dtstart = ownerEvent[i].dtstart;
            // string memory dtend = ownerEvent[i].dtend;
            string memory dtstamp = unixTimeToStr(ownerEvent[i].dtstamp);
            string memory uid = uintToStr(ownerEvent[i].uid);
            string memory dtstart = unixTimeToStr(ownerEvent[i].dtstart);
            string memory dtend = unixTimeToStr(ownerEvent[i].dtend);
            string memory summary = ownerEvent[i].summary;
            string memory description = ownerEvent[i].description;
            outputString = string(
                abi.encodePacked(outputString,"BEGIN:VEVENT\n",
                                 "DTSTAMP:", dtstamp, "\n",
                                 "UID:", uid, "@", ownerStr, "\n",
                                 "DTSTART:", dtstart, "\n",
                                 "DTEND:", dtend, "\n",
                                 "SUMMARY:", summary, "\n",
                                 "DESCRIPTION:", description, "\n",
                                 "END:VEVENT\n"
                                )
            );
        }
        return string(abi.encodePacked(vCalHeader, outputString, vCalFooter));
    }


    function unixTimeToStr(uint _unixTime) private pure returns (string memory) {
        return string(
            abi.encodePacked(
            leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getYear(_unixTime)),
            leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getMonth(_unixTime)),
            leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getDay(_unixTime)),
            "T",
            leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getHour(_unixTime)),
            leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getMinute(_unixTime)),
            leadingZeroAdd(BokkyPooBahsDateTimeLibrary.getSecond(_unixTime))
        )
        );
    }

    function leadingZeroAdd(uint _timePoint) private pure returns (string memory) {
        string memory timeStr;
        uint requiresZero = 9; // Time points less than 9 require leading zero
        if (_timePoint > requiresZero ) {
            timeStr = uintToStr(_timePoint);
        } else {
            timeStr = string(abi.encodePacked("0", uintToStr(_timePoint)));
        }
        return timeStr;
    }

    // Returns all msg for msg.sender, regardless of time
    function getEventsObj(address _calOwner) public view returns (VEvent[] memory) {

        // Return error if no events
        VEvent[] memory tempData = store[_calOwner];
        return tempData;
    }

    /// @notice converts number to string
    /// @dev source: https://github.com/provable-things/ethereum-api/blob/master/oraclizeAPI_0.5.sol#L1045
    /// @param _i integer to convert
    /// @return _uintAsString string
    function uintToStr(uint _i) internal pure returns (string memory _uintAsString) {
        uint number = _i;
        if (number == 0) {
            return "0";
        }
        uint j = number;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (number != 0) {
            bstr[k--] = byte(uint8(48 + number % 10));
            number /= 10;
        }
        return string(bstr);
    }

    /// @notice converts address to string
    /// @dev source: https://ethereum.stackexchange.com/a/8447/61217
    /// @param _add address
    /// @return string
    function addressToStr(address _add) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(_add) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    /// @notice character conversion for addressToStr
    /// @dev source: https://ethereum.stackexchange.com/a/8447/61217
    /// @param _b byte
    /// @return c byte
    function char(byte _b) internal pure returns (byte c) {
        if (uint8(_b) < 10) {
            return byte(uint8(_b) + 0x30);
        } else {
            return byte(uint8(_b) + 0x57);
        }
    }

}

// CalStore.deployed().then(function(instance) {app = instance})
// app.storeEvent(1595170930, 1596121200, 1596123000, "Meeting 1", "First Meeting");
// app.storeEvent(1595171030, 1596290400, 1596295800, "Meeting 2", "Second Meeting");
// app.getEventsObj('0xE65616E1197298060479799B225a02D06005CA14');
// app.getEventsIcal('0xE65616E1197298060479799B225a02D06005CA14');
// app.justSayHi();

// get all accounts: web3.eth.getAccounts().then(console.log)

