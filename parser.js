const functions = [
    "ADD","SUB","EXP","CHAR"
];
/**
 * @param {String} str 
 * @returns {Array<number, any>}
 */
function parseByType(str){
    let index = 0;
    let val;
    str = str.trim();
    if(str[0] == "\""){
        index++; // string open
        val = "";
        let backslashFound = false;
        while((str[index] != "\"") || backslashFound){
            if(str[index] === undefined) break; // avoid while true bugs
            if(str[index] == "\\"){
                backslashFound = true;
            }else{
                val += str[index];
            }
            index++;
        }
        index++; // string close
    }else if(str.trimStart()[0] == "-" || parseInt(str.trimStart()[0])){
        val = str.trimStart()[0] == "-" ? "-0" : "0";
        if(str.trimStart()[0] == "-")
            index = str.indexOf("-") + 1;
        while(true){
            let newVal = val + str[index++];
            if(isNaN(Number(newVal))) break;
            else{
                val = newVal;
            }
        }
        val = parseInt(val);
        index--;
    }else{
        if(str[index] == ")") return;
        val = {variable:""};
        while(str[index] && str[index] != "("){
            val.variable += str[index++];
        }
        if(str[index] == "("){
            index++;
            val.functionName = val.variable;
            delete val.variable;
            val.arguments = [];
            while(str[index] != ")"){
                let [i,v] = parseByType(str.slice(index));
                index += i;
                while(str[index] == " ") index++; // remove spaces
                if(v.variable) index--; // fix index
                let sep = str[index];
                if(sep === ")"){
                    index++;
                    val.arguments.push(v);
                    break;
                }
                if(sep === ","){
                    index++;
                    val.arguments.push(v);
                }else throw new SyntaxError("NO SEP");
                while(str[index] == " ") index++; // remove spaces
            }
        }
    }
    //console.log(val.arguments);
    return [index,val];
}
const keywordsParser = {
    LET(args){
        const [key,value] = args.split("=");
        const tkey = key.trim();
        const tval = parseByType(value.trim());
        return {key: tkey, value: tval};
    },
    GOTO(args){
        return parseInt(args);
    },
    PRINT(args){
        let index = 0;
        let arg = [];
        while(args[index]){
            let [i,val] = parseByType(args.slice(index));
            index += i;
            
            while(args[index] == " ") index++; // remove spaces
            let sep = args[index];
            if(!sep){
                arg.push(val);
                return arg;
            }
            if(sep == ";" || sep == ","){
                index++;
                arg.push(val);
            }else throw SyntaxError("NO SEP");
            while(args[index] == " ") index++; // remove spaces
        }
    }
};
keywordsParser["!"] = keywordsParser.ASM = keywordsParser.EDITOR = keywordsParser.RUN = keywordsParser.REM = keywordsParser.HELP = keywordsParser.LIST = keywordsParser.END = function(){}
keywordsParser.INPUT = keywordsParser.PRINT;
/**
 * 
 * @param {String} args 
 */
keywordsParser.IF = function(args){
    const [condition,...command] = args.split("THEN");
    const realCommand = command.join("THEN");
    const [check1, check2] = condition.split("=");

    return {command: parse_line2(realCommand.trimStart()), confition: {
        check1: parseByType(check1.trimEnd())[1], check2:parseByType(check2.trimStart())[1]
    }};
}


/**
 * @param {String} str
 * @returns {{line: number, instruction: string, arguments: any, lineOffset: number}}
 */
function parse_line(str){
    const [instructionLine, instruction, ...arguments] = str.split(" ");
    const line = parseInt(instructionLine);
    const parserFun = keywordsParser[instruction];
    if(!parserFun){
        throw new SyntaxError("INVAL_INSTRUCTION");
    }
    if(!line) return;
    return {
        line,
        instruction,
        arguments: parserFun(arguments.join(" ")),
        lineOffset: str.indexOf(" ")
    };
}
/**
 * @param {String} str
 * @returns {{instruction: string, arguments: any}}
 */
function parse_line2(str){
    const [instruction, ...arguments] = str.split(" ");
    const parserFun = keywordsParser[instruction];
    if(!parserFun){
        throw new SyntaxError("INVAL_INSTRUCTION");
    }
    return {
        instruction,
        arguments: parserFun(arguments.join(" "))
    };
}
module.exports = {parse_line,parse_line2};