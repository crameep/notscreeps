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
            if (target.energy <= (target.energyCapacity * 0.05)) {
                console.log("Not enough enegy at: " + target);
                delete creep.memory.target;
                console.log(creep.memory.target);
            }
            
            //console.log("Target: " + target);
            if(creep.harvest(target) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(target);
            }
        }
        else
        {
            

            var sources = creep.room.find(FIND_SOURCES);
            for (let n in sources) {
                
                if (sources[n].energy >= (sources[n].energyCapacity * .6)){
                 creep.memory.target = sources[n].id;
                } 
            }
            var target = Game.getObjectById(creep.memory.target);
            if (target) {
               
            if(creep.harvest(target) == ERR_NOT_IN_RANGE)
            {
                //console.log("moving to: " + source);
                creep.moveTo(target);
            }
            } else {
            creep.memory.state = newState
            creep.say(creep.memory.state);
            }
        }
         if((creep.carry.energy >= creep.carryCapacity) && !(creep.memory.role == 'miner')) // Miner can not carry, and shouldn't change roles once mining
        {
            creep.memory.state = newState
            creep.say(creep.memory.state);
        }
    }
};
