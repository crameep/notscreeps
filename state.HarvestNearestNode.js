/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('state.HarvestNearestNode');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run: function (creep, newState, altState)
    {
        if (creep.memory.target)
        {
            var target = Game.getObjectById(creep.memory.target);
            //console.log("Target: " + target);
            if(creep.harvest(target) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(target);
            }
        }
        else
        {

            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (source) creep.memory.target = source.id;
            if(creep.harvest(source) == ERR_NOT_IN_RANGE)
            {
                //console.log("moving to: " + source);
                creep.moveTo(source);
            }
        }
         if((creep.carry.energy >= creep.carryCapacity) && !(creep.memory.role == 'miner')) // Miner can not carry, and shouldn't change roles once mining
        {
            creep.memory.state = newState
            creep.say(creep.memory.state);
        }
    }
};
