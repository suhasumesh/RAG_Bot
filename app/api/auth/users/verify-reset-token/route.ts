import { NextRequest, NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongoDB";
import { User } from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req:NextRequest){
    await connectToMongo();

    const {token} = await req.json();
    console.log(token);
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        console.log(`Decoded : ${JSON.stringify(decoded)}`);
        
        const user = await User.findOne({resetPasswordToken:token,resetPasswordExpires:{$gt:new Date()}});

        if(!user){
            return NextResponse.json({valid:false,error:"Invalid or expired token"},{status:400});
        }
        // console.log(JSON.stringify(user));
        
        return NextResponse.json({valid:true});
    }catch(err){
        return NextResponse.json({valid:false,error:"Invalid or expired token"},{status:400});
    }
}