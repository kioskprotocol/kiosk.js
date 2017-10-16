/** @title Resolver contract that specifies an API endpoint where product information can be retrieved */
contract TestResolver {
    bytes4 constant INTERFACE_META_ID = 0x01ffc9a7;         // bytes4(sha3("supportsInterface(bytes4)"))
    bytes4 constant PRODUCT_URL_INTERFACE_ID = 0xaf655719;  // bytes4(sha3("productURL(uint256)"))

    function supportsInterface(bytes4 interfaceID) public constant returns (bool) {
        return interfaceID == INTERFACE_META_ID ||
               interfaceID == PRODUCT_URL_INTERFACE_ID;
    }

    function productURL(uint256 DIN) public constant returns (string) {
        return "https://www.google.com/";
    }

}