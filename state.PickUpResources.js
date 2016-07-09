/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('state.PickUpResources');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
run: function (creep, newState, altState)
{
     //if(creep.memory.role == 'upgrader') console.log("need more resources");
    var target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);
    //console.log(target);
   var containers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
    filter: { structureType: STRUCTURE_CONTAINER }
    });
    
    if(target)
    {
        var result = creep.pickup(target);
        
        if( result == ERR_NOT_IN_RANGE)
        {
        creep.moveTo(target);
        }
        
        else if (creep.carry.energy >= creep.carryCapacity)
        {
            console.log(newState);
            creep.memory.state = newState
            creep.say(creep.memory.state);
        }
        else if( result == OK)
        {
            // We picked up something, usualy this means we're full or there's nothing left here.
            // Don't be an asshole and hog the spot, go do what you need to do.
            creep.memory.state = newState
            creep.say(creep.memory.state);
        }
    }
    

    
     else if(container)
    {
            var container = containers[0];
    
    
    if (total < 100) {
        //console.log("using alternate container");
        var container = containers[1];
         var total = _.sum(container.store);
    }  
        var total = _.sum(container.store);
        if (total < 100) {
            creep.memory.state = newState
            creep.say(creep.memory.state);
        }
        //console.log("Atempting to pull from container")
        var result = creep.pickup(container);
        if( result == ERR_NOT_IN_RANGE)
        {
        creep.moveTo(container);
        } 
        else if (creep.carry.energy < creep.carryCapacity || total > 100)
        {
            //console.log("Transfering Energy...");  
            container.transfer(creep, RESOURCE_ENERGY);
        }
        
        else if( result == OK || creep.carry.energy == creep.carryCapacity)
        {
            // We picked up something, usualy this means we're full or there's nothing left here.
            // Don't be an asshole and hog the spot, go do what you need to do.
            creep.memory.state = newState
            creep.say(creep.memory.state);
        }
    }    
    
    else
    {
        // No valid targets for pickup, perform alternate tasks
        creep.memory.state = altState
        creep.say(creep.memory.state);
    }
    if(creep.carry.energy == creep.carryCapacity)
    {
        creep.memory.state = newState
        creep.say(creep.memory.state);
    }
}
};
