process.title = "Basic.JS";
const {parse_line,parse_line2} = require("./parser.js");
const readline = require("readline-sync");
const repl = require("repl");
const code = [],variables = {},functions = {
    ABS(args){
        const val = Math.abs(replace_args(args)[0]);
        if(isNaN(val)) throw new TypeError("INVALID VALUE");
        return val;
    },
    CHAR(args){
        const parsed_args = replace_args(args);
        let str = "";
        for(const value of parsed_args){
            if(typeof value != "number") throw new TypeError("INVALID VALUE");
            if(value < 0) throw new RangeError("VALUE < 0");
            str += String.fromCharCode(value);
        }
        return str;
    },
    ADD(args){
        const parsed_args = replace_args(args);
        if(typeof parsed_args[0] != "number") throw new TypeError("INVALID VALUE");
        if(typeof parsed_args[1] != "number") throw new TypeError("INVALID VALUE");
        return parsed_args[0] + parsed_args[1];
    },
    SUB(args){
        const parsed_args = replace_args(args);
        if(typeof parsed_args[0] != "number") throw new TypeError("INVALID VALUE");
        if(typeof parsed_args[1] != "number") throw new TypeError("INVALID VALUE");
        return parsed_args[0] - parsed_args[1];
    }
};
/**
 * 
 * @param {any[]} args
 * @returns {string[] | number[]}
 */
function replace_args(args){
    let newArgs = [];
    for(const val of args){
        if(typeof val == "object"){
            if(val.variable !== undefined){
                newArgs.push(variables[val.variable]);
            }else{
                newArgs.push(functions[val.functionName](val.arguments));
            }
        }else{
            newArgs.push(val);
        }
    }
    return newArgs;
}
let lineNumber = 10,interval,end,codeStr = {};
function toCode(str){
    const parsed = parse_line(str);
    code.push({line: parsed.line, instruction: parsed.instruction, arguments: parsed.arguments});
}
const instructions = {
    LET(args){
        variables[args.key] = args.value;
    },
    GOTO(arg){
        lineNumber = arg;
    },
    END(){
        if(!end){
            return process.exit(0);
        }
        clearInterval(interval);
        end?.();
        end = undefined;
        console.log("READY.");
    },
    LIST(){
        for(const key in codeStr){
            console.log(`${key}${codeStr[key]}`);
        }
    },
    PRINT(args){
        if(!args) throw new TypeError("NO ARGUMENTS");
        const pargs = replace_args(args);
        for(const arg of pargs){
            if(arg === undefined) throw new TypeError("EMPTY VARIABLE");
            process.stdout.write(arg.toString());
        }
        console.log();
    },
    HELP(){
        console.log(`LET KEY = VAL\nGOTO LINENUM\nEND\nLIST\nPRINT ...MESSAGE;\nHELP\nREM ...\nINPUT MSG;VAR...;\nRUN\nEDITOR\nASM\n!\nIF CHECK1 = CHECK2 THEN COMMAND\n\nADD(INT,INT)\nSUB(INT,INT)\nCHAR(INT...)\nABS(INT)`);
    },
    REM(){},
    INPUT(args){
        if(!args) throw new TypeError("NO ARGUMENTS");
        for(const arg of args){
            if(typeof arg != "object"){
                process.stdout.write(arg);
            }else{
                const val = readline.question("");
                variables[arg.variable] = val;
            }
        }
    },
    RUN(){
        return new Promise(r => {
            lineNumber = code[0]?.line;
            if(!lineNumber){
                console.log("NO CODE.");
                return r();
            }
            end = r;
            interval = setInterval(step,0);
        });
    },
    async EDITOR(){
        await new Promise(async r => {
            while(true){
                const val = readline.question("EDITOR) ");
                if(val === "DONE") return r();
                try{
                    const parsed = parse_line(val);
                    codeStr[parsed.line] = val.slice(parsed.lineOffset);
                }catch(e){
                    console.log(e.message.toUpperCase());
                }
            }
        });
        for(const key in codeStr){
            console.log(`${key}${codeStr[key]}`);
            toCode(`${key}${codeStr[key]}`);
        }
        console.log("READY.");
    },
    ASM(){
        return new Promise(r => {
            const server = repl.start();
            server.once("exit", () => r());
        });
    },
    IF(args){

    }
};
instructions["!"] = instructions.ASM;
async function step(){
    const index = code.findIndex(c => c.line == lineNumber);
    const instruction = code[index];
    const nextInstruction = code[index+1];
    lineNumber = nextInstruction ? nextInstruction.line : lineNumber;
    await instructions[instruction.instruction](instruction.arguments);
    if(code.findIndex(c => c.line == lineNumber) < 0){
        instructions.END();
    }
}

async function runOne(str){
    const instruction = parse_line2(str);
    await instructions[instruction.instruction](instruction.arguments);
}

console.log("BASIC.JS V1.0.0");
(async function(){
    while(true){
        const val = readline.question(") ");
        if(!val) continue;
        try{
            await runOne(val);
        }catch(e){
            console.log(e.message.toUpperCase());
        }
    }
})();