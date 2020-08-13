// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

import GuideInfoItem from "./GuideInfoItem"

@ccclass
export default class GuideCtrl extends cc.Component {

    @property(cc.Node)
    maskNode:cc.Node = null;
    @property(cc.Node)
    inputBlockNode:cc.Node = null;
    @property(cc.Node)
    actionLayer:cc.Node = null;    
    @property(cc.Prefab)
    cursor:cc.Prefab = null;
    @property(cc.AudioClip)
    typeWriterAudio:cc.AudioClip = null;

    typeWriterAudioid:number = 0;
    grayLayerOriginPos:cc.Vec2 = null;
    currentstep:number = 0;
    maxstep:number = 0;
    grayLayer:cc.Node = null;
    cursorNode:cc.Node = null;

    contextLabel:cc.RichText = null;
    stepsInfoMap:Map<number,GuideInfoItem> = null;

    currentContext:string = null;
    isTypeWritering:boolean = false;
    charIndex:number = 0;
    parse:(p:number)=>[string,boolean] = null;
    onLoad(){
        //test code begin
        this.stepsInfoMap = new Map();
        this.stepsInfoMap.set(0,{step:0,nodePath:"Canvas/New Node/New Sprite(Splash)/button1",floatContext:"<fontname= \"Arial\"  ><shadow>11111</shadow></fontname><u><link=\"www.baidu.com\">abc</link></u><img=\"CloseSelected.png\"><color = 0xFF><size=50>defg</color><outline=2 color=0xFF0000FF>hijk</outline></size>",bubbleOrigin:cc.v3(-500,-500,0),floatPos: cc.v3(200,100,0),cursorPos: cc.v3(120,-160,0)});
        this.stepsInfoMap.set(1,{step:1,nodePath:"Canvas/New Node/New Sprite(Splash)/button2",floatContext:"<color=#00ff00>欢迎使用 Cocos Creator 用户手册！本手册包括详尽的使用说明、面向不同职能用户的工作流程和 step by step 的新手教程。能够帮您快速掌握使用 Cocos Creator 开发跨平台游戏的方法。</color>",bubbleOrigin:cc.v3(500,500,0),floatPos: cc.v3(-200,100,0),cursorPos: cc.v3(120,-300,0)});
        this.stepsInfoMap.set(2,{step:2,nodePath:"Canvas/New Node/New Sprite(Splash)/button3",floatContext:"<color=#00ff00>欢迎使用 Cocos Creator 用户手册！本手册包括详尽的使用说明、面向不同职能用户的工作流程和 step by step 的新手教程。能够帮您快速掌握使用 Cocos Creator 开发跨平台游戏的方法。</color>",bubbleOrigin:cc.v3(-500,500,0),floatPos: cc.v3(-200,100,0),cursorPos: cc.v3(0,0,0)});
        this.maxstep = 3;
        this.currentstep = 0;
        //test code end

        console.log("GuideCtrl onload");
        this.grayLayerOriginPos = this.maskNode.getChildByName("GrayLayer").convertToWorldSpaceAR(cc.v2(0,0));
        this.grayLayer = this.maskNode.getChildByName("GrayLayer");
        this.cursorNode = cc.instantiate(this.cursor);
        this.cursorNode.name = "cursor";
        this.cursorNode.active = false;
        this.actionLayer.addChild(this.cursorNode);
        this.maskNode.active = true;
        this.inputBlockNode.active = true;
        this.actionLayer.active = true;
        
        let node = new cc.Node();
        this.contextLabel = node.addComponent(cc.RichText);
        this.contextLabel.node.active = false;
        this.contextLabel.node.setAnchorPoint(0,1);
        this.contextLabel.node.color = cc.color(0,255,0);
        this.contextLabel.node.position = cc.v3(-400, 430, 0);
        this.contextLabel.maxWidth = 600;
        this.contextLabel.fontSize = 20;
        this.contextLabel.lineHeight = 30;
        this.contextLabel.string = "";
        this.contextLabel.horizontalAlign = cc.macro.TextAlignment.LEFT;
        this.actionLayer.addChild(this.contextLabel.node);
    }

    deepCopy(target){ 
        let copyed_objs = [];
            function _deepCopy(target){ 
                if((typeof target !== 'object')||!target){return target;}
                for(let i= 0 ;i<copyed_objs.length;i++){
                    if(copyed_objs[i].target === target){
                        return copyed_objs[i].copyTarget;
                    }
                }
                let obj = {};
                if(Array.isArray(target)){
                    obj = [];
                }
                copyed_objs.push({target:target,copyTarget:obj}) 
                Object.keys(target).forEach(key=>{ 
                    if(obj[key]){ return;} 
                    obj[key] = _deepCopy(target[key]);
                }); 
                return obj;
            } 
            return _deepCopy(target);
    }

    parseRichString(str:string){
        let repaceStr = str.replace(new RegExp(/<.+?>/g),'|');
        let strArray = repaceStr.split('|');
        
        let strArray1 = new Array<string>();
        for(let item in strArray){
            if(strArray[item].length === 0) continue;
            strArray1.push(strArray[item]);
        }

        let loop = 0;

        while(loop < strArray1.length){
            str = str.replace(strArray1[loop],`!#${loop}!#`);
            loop++;
        }

        return (charIndex:number):[string,boolean]=>{
            let index = 0;
            while(charIndex>0){
                if(charIndex>strArray1[index].length){
                    charIndex -= strArray1[index].length;
                    index++;
                    if(index >= strArray1.length) break;
                }
                else{
                    break;
                }
            }

            let str1 = str;
            for(let i=0; i<strArray1.length; i++){
                if(i<index){
                    str1 = str1.replace(`!#${i}!#`, strArray1[i]);
                }
                else if(i === index){
                    str1 = str1.replace(`!#${i}!#`, strArray1[i].slice(0,charIndex));
                }
                else{
                    str1 = str1.replace(`!#${i}!#`, '');
                }
            }

            return [str1, index >= strArray1.length];
        };
    }

    typewriter(){
        this.charIndex++;
        this.contextLabel.string = this.parse(this.charIndex)[0];
        let bStop = this.parse(this.charIndex)[1];
        if(bStop){
            this.isTypeWritering = false;
            this.unschedule(this.typewriter);
            cc.audioEngine.pause(this.typeWriterAudioid);

        }
    }

    playGuideAnim(){
        this.inputBlockNode.active = true;
        this.cursorNode.active = false;
        this.contextLabel.string = "";
        this.contextLabel.node.active = false;
        let item = this.stepsInfoMap.get(this.currentstep);
        this.currentContext = item.floatContext;
        cc.tween(this.maskNode).set({position:item.bubbleOrigin}).to(1,{position:item.cursorPos}).call(()=>{
            this.inputBlockNode.active = false;
            this.cursorNode.active = true;
            this.contextLabel.node.active = true;
            this.cursorNode.setPosition(item.cursorPos);
            this.charIndex = 0;
            this.schedule(this.typewriter,0.05);
            this.isTypeWritering = true;
            this.parse = this.parseRichString(this.currentContext);
            if(cc.audioEngine.getState(this.typeWriterAudioid) === cc.audioEngine.AudioState.PAUSED)
            {
                cc.audioEngine.resume(this.typeWriterAudioid);
            }
            else if(cc.audioEngine.getState(this.typeWriterAudioid) === cc.audioEngine.AudioState.ERROR){
                this.typeWriterAudioid = cc.audioEngine.play(this.typeWriterAudio, true, 1);
            }
            }).start();
    }

    onEnable(){
        console.log("GuideCtrl onEnable");
        if(this.currentstep < this.maxstep){
            this.node.on(cc.Node.EventType.TOUCH_START,(e:cc.Event.EventTouch)=>{
                console.log("Touch canvas");
                if(this.isTypeWritering){
                    this.isTypeWritering = false;
                    this.unschedule(this.typewriter);
                    this.charIndex == this.stepsInfoMap.get(this.currentstep).floatContext.length;
                    this.contextLabel.string = this.stepsInfoMap.get(this.currentstep).floatContext;
                    cc.audioEngine.pause(this.typeWriterAudioid);
                    e.stopPropagation();
                    return;
                }
                let nodePath = this.stepsInfoMap.get(this.currentstep).nodePath;
                if((e.target as cc.Node) != cc.find(nodePath))
                {
                    e.stopPropagation();
                }
               
            }, this, true);

            this.scheduleOnce(()=>{
                this.playGuideAnim();
            });
        }
        else{
            this.node.removeComponent("GuideCtrl");
        }
    }

    onDisable(){
        console.log("GuideCtrl onDisable");
        this.node.off(cc.Node.EventType.TOUCH_START);
        this.grayLayer.active = false;
        this.inputBlockNode.active = false;
        this.actionLayer.active = false;
        cc.audioEngine.uncache(this.typeWriterAudio);
    }

    start () {
    }

    onProcessSteps(){
        console.log("GuideCtrl onProcessSteps");
        this.currentstep++;
        if(this.currentstep != this.maxstep){
            this.playGuideAnim();
        }
        else{
            this.node.removeComponent("GuideCtrl");
        }
    }

    update (dt) {

    }

    lateUpdate(){
        this.grayLayer.setPosition(this.maskNode.convertToNodeSpaceAR(this.grayLayerOriginPos));
    }
}
