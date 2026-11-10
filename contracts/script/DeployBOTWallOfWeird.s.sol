// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BOTWallOfWeird} from "../src/BOTWallOfWeird.sol";

contract DeployBOTWallOfWeird is Script {
    function run() external returns (BOTWallOfWeird deployed) {
        string memory rawKey = vm.envString("PRIVATE_KEY");
        if (bytes(rawKey).length == 64) {
            rawKey = string.concat("0x", rawKey);
        }
        uint256 deployerPrivateKey = vm.parseUint(rawKey);
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying BOTWallOfWeird to Chain ID:", block.chainid);
        if (block.chainid != 968) {
            console.log("WARNING: Expected BOT Chain Testnet (Chain ID 968)");
        }
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);
        deployed = new BOTWallOfWeird();
        vm.stopBroadcast();

        console.log("BOTWallOfWeird deployed at:", address(deployed));
        console.log("Set CONTRACT_ADDRESS in your .env to:", address(deployed));
    }
}
