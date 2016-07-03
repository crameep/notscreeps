var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleRecycle = require('role.recycle');
var roleRepairer = require('role.repairer');

var standard_worker = [ WORK, WORK, CARRY, MOVE, CARRY, WORK, MOVE];
var standard_repairer = [ MOVE, WORK, WORK, CARRY, MOVE];
var standard_builder = [ MOVE, CARRY, CARRY, MOVE, WORK];

module.exports.loop = function () {
    // Memory setup
    if(Memory.globals == null){
        Memory.globals = {};
    }
    if(Memory.globals.debug_level == null){
        Memory.globals.debug_level = 1;
    }

    if(Memory.globals.harvesters == null){
        Memory.globals.harvesters = {};
    }
    if(Memory.globals.harvesters.min == null){
        Memory.globals.harvesters.min = 6;
    }
    if(Memory.globals.harvesters.desired == null){
        Memory.globals.harvesters.desired = 9;
    }
    if(Memory.globals.harvesters.max == null){
        Memory.globals.harvesters.max = 10;
    }

    if(Memory.globals.upgraders == null){
        Memory.globals.upgraders = {};
    }
    if(Memory.globals.upgraders.desired == null){
        Memory.globals.upgraders.desired = 5;
    }

    if(Memory.globals.builders == null){
        Memory.globals.builders = {};
    }
    if(Memory.globals.builders.max == null){
        Memory.globals.builders.max = 6;
    }
   
    if(Memory.globals.repairers == null){
        Memory.globals.repairers = {};
    }
    if(Memory.globals.repairers.desired == null){
        Memory.globals.repairers.desired = 1;
    }

    if(Memory.status == null){
        Memory.status = {};
    }
    Memory.status.failed_to_spawn = false;

    // Memory cleanup
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]){
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory: ', name);
        }
    }


    var available_spawners = _.filter(Game.spawns, (spawn) => spawn.spawning == null);

    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    var repairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'repairer');
    
    if(Memory.globals.debug_level >= 2){
            
        console.log("Builders: " + builders.length );
        console.log("Harvesters: " + harvesters.length );
        console.log("Upgraders: " + upgraders.length);
        console.log("Repairers: " + repairers.length);
    }

    var construction_sites = _.values(Game.spawns)[0].room.find(FIND_CONSTRUCTION_SITES).length;
    var needed_builders = construction_sites;
    //console.log(needed_builders);
    if(!isNaN(builders.length)){
        needed_builders -= builders.length;
    }

    var converted_builders_to_harvesters = false;
    var converted_upgraders_to_harvesters = false;

    // CREATE WORKERS

    // Create Harvesters
    while(harvesters.length < Memory.globals.harvesters.desired){
         //console.log("Not Enough Harvesters");
        if(upgraders.length > Memory.globals.upgraders.desired){
            var convert = upgraders[0];
            upgraders.splice(0, 1);
            convert.memory.role = 'harvester';
            harvesters.push(convert);
            if(Memory.globals.debug_level >= 1){
                console.log("Re-assigned upgrader '"+convert.name+"' to harvester duty!");
            }
            converted_upgraders_to_harvesters = true;
        } else if(needed_builders < 0){
            var convert = builders[0];
            builders.splice(0, 1);
            convert.memory.role = 'harvester';
            harvesters.push(convert);
            if(Memory.globals.debug_level >= 1){
                console.log("Re-assigned builder '"+convert.name+"' to harvester duty!");
            }
            converted_builders_to_harvesters = true;
        } else if (available_spawners.length > 0) {
            var name = available_spawners[0].createCreep(standard_worker, null,
                    {'role': 'harvester'});
            if(typeof name != 'number'){
                available_spawners.splice(0,1);
                harvesters.push(Game.creeps[name]);
                if(Memory.globals.debug_level >= 1){
                    console.log("Spawning "+name+" as harvester!");
                }
            } else {
                if(Memory.globals.debug_level >= 3){
                    console.log("Unable to spawn harvester! Error "+name);
                    Memory.status.failed_to_spawn = true;
                }
                break;
            }
        } else {
            if(Memory.globals.debug_level >= 3){
                console.log("Unable to satisfy harvesting needs!");
            }
            break;
        }
    }

    // Create Upgraders
    while(upgraders.length < Memory.globals.upgraders.desired){
        if(!converted_upgraders_to_harvesters && harvesters.length > Memory.globals.harvesters.min){
            var convert = harvesters[0];
            harvesters.splice(0, 1);
            convert.memory.role = 'upgrader';
            upgraders.push(convert);
            if(Memory.globals.debug_level >= 1){
                console.log("Re-assigned harvester '"+convert.name+"' to upgrader duty!");
            }
        } else if(available_spawners.length > 0) {
            var name = available_spawners[0].createCreep(standard_worker, null,
                    {'role': 'upgrader'});
            if(typeof name != 'number'){
                available_spawners.splice(0,1);
                upgraders.push(Game.creeps[name]);
                if(Memory.globals.debug_level >= 1){
                    console.log("Spawning "+name+" as upgrader!");
                }
            } else {
                if(Memory.globals.debug_level >= 3){
                    console.log("Unable to spawn upgrader! Error "+name);
                    Memory.status.failed_to_spawn = true;
                }
                break;
            }
        } else {
            if(Memory.globals.debug_level >= 3){
                console.log("Unable to satisfy upgrade needs!");
            }
            break;
        }
    }
    // Create Builders
    while(needed_builders > 0 && builders.length < Memory.globals.builders.max){
        if(!converted_builders_to_harvesters && harvesters.length > Memory.globals.harvesters.min){
            var convert = harvesters[0];
            harvesters.splice(0, 1);
            convert.memory.role = 'builder';
            builders.push(convert);
            if(Memory.globals.debug_level >= 1){
                console.log("Re-assigned harvester '"+convert.name+"' to builder duty!");
            }
        } else if(available_spawners.length > 0) {
            var name = available_spawners[0].createCreep(standard_builder, null,
                    {'role': 'builder'});
            if(typeof name != 'number'){
                available_spawners.splice(0,1);
                builders.push(Game.creeps[name]);
                if(Memory.globals.debug_level >= 1){
                    console.log("Spawning "+name+" as builder!");
                }
            } else {
                if(Memory.globals.debug_level >= 3){
                    console.log("Unable to spawn builder! Error "+name);
                    Memory.status.failed_to_spawn = true;
                }
                break;
            }
        } else {
            if(Memory.globals.debug_level >= 3){
                console.log("Unable to satisfy build needs!");
            }
            break;
        }
        needed_builders--;
    }
    
    //Create Repairers
    while(repairers.length < Memory.globals.repairers.desired){
        //console.log("not enough repairers");
        if(!converted_upgraders_to_harvesters && harvesters.length > Memory.globals.harvesters.min){
            console.log("Attempting to convert to repair");
            var convert = harvesters[0];
            harvesters.splice(0, 1);
            convert.memory.role = 'repairer';
            repairers.push(convert);
            if(Memory.globals.debug_level >= 1){
                console.log("Re-assigned harvester '"+convert.name+"' to repairer duty!");
            }
        } else if(available_spawners.length > 0) {
            //console.log("Atempting to spawn repairer");
            var name = available_spawners[0].createCreep(standard_repairer, null,
                    {'role': 'repairer'});
            if(typeof name != 'number'){
                available_spawners.splice(0,1);
                repairers.push(Game.creeps[name]);
                if(Memory.globals.debug_level >= 1){
                    console.log("Spawning "+name+" as repairer!");
                }
            } else {
                if(Memory.globals.debug_level >= 3){
                    console.log("Unable to spawn repairer! Error "+name);
                    Memory.status.failed_to_spawn = true;
                }
                break;
            }
        } else {
            if(Memory.globals.debug_level >= 3){
                console.log("Unable to satisfy repairer needs!");
            }
            break;
        }
    }

    // DELETE SURPLUS WORKERS

    while(harvesters.length > Memory.globals.harvesters.max){
        var recycle = harvesters[0];
        harvesters.splice(0, 1);
        recycle.memory.role = 'recycle';
        if(Memory.globals.debug_level >= 1){
            console.log("Too many harvesters, recycling '"+recycle.name+"'!");
        }
    }
    while(upgraders.length > Memory.globals.upgraders.desired){
        var recycle = upgraders[0];
        upgraders.splice(0, 1);
        recycle.memory.role = 'recycle';
        if(Memory.globals.debug_level >= 1){
            console.log("Too many upgraders, recycling '"+recycle.name+"'!");
        }
    }
    while(builders.length > construction_sites){
        var recycle = builders[0];
        builders.splice(0, 1);
        recycle.memory.role = 'recycle';
        if(Memory.globals.debug_level >= 1){
            console.log("Too many builders, recycling '"+recycle.name+"'!");
        }
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        } else if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        } else if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        } else if (creep.memory.role == 'recycle') {
            roleRecycle.run(creep);
        } else if(creep.memory.role == 'repairer') {
            roleRepairer.run(creep);
        } else {
            // Recycle unknowns!
            creep.memory.role = 'recycle';
        }
    }

}

// vim:ts=4 sts=4 sw=4 et