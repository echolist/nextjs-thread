"use server"

import { userAgent } from "next/server";
import Thread from "../models/thread.model";
import { connectToDb } from "../mongoose";
import User from "../models/user.model";
import { revalidatePath } from "next/cache";
import { error } from "console";

interface Params {
    text: string,
    author: string, 
    communityId : string | null,
    path: string,
}
export async function createThread({
    text,author, communityId,path
} : Params) {
    try{
        connectToDb();

        const createdThread = await Thread.create({
            text : text,
            author : author,
            community:communityId,
        });
    
        await User.findByIdAndUpdate(author,{
            $push: {threads: createdThread._id}
        });
    
        revalidatePath(path);
    } catch (error : any) {
        throw new Error (`Error creating thread : ${error.message}`);
    }
   
}

export async function fetchPosts(pageNumber = 1, pageSize = 20)
{
    try
    {
        connectToDb();

        const skip = pageSize * (pageNumber-1);


        //get the post that have no parents ( top level threads )

        const postQuery = Thread.find({
            parentId: { $in: [null, undefined]}
        })
        .sort({createdAt: 'desc'})
        .skip(skip)
        .limit(pageSize)
        .populate({path:"author", model:User})
        .populate({
            path:"children", 
            populate: {
                path: "author",
                model:User,
                select:"_id name parentId image"
            }
        });

        const totalCount = await Thread.countDocuments({
            parentId: { $in: [null, undefined]}
        });

        const posts = await postQuery.exec();

        const isNext = totalCount > skip + posts.length;
        return ({posts, isNext});
    }catch(error){

    }
}

export async function fetchThreadById(id: string){
    connectToDb();
    try {
        const thread = await Thread.findById(id)
        .populate({
            path: 'author',
            model: User,
            select:"_id id name image"
        })
        .populate({
            path:'children',
            populate: [
                {
                    path:'author',
                    model: User,
                    select: "_id id name parentId image"
                },
                {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path:'author',
                        model:User,
                        select: "_id id name parentId image"
                    }
                }
            ]
        })
        .exec();
        return thread;
    } catch(error : any){
        throw new Error (`Error getting thread : ${error.message}`);
    }
}

interface commentToThread {
    threadId: string,
    commentText: string, 
    userId: string,
    path: string
}
export async function addCommentToThread(
    {
        threadId,
        commentText,
        userId,
        path
    } : commentToThread
){
    connectToDb();
    try{
        //Find original thread by its ID
        const originalThread = await Thread.findById(threadId);

        if(!originalThread)
        {
            throw new Error("Thread not found");
        }
        //create a new thread with comment text
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId
        })

        //save new thread
        const savedCommentThread = await commentThread.save();

        //update reference children
        originalThread.children.push(savedCommentThread._id);

        //save original thread
        await originalThread.save();

        revalidatePath(path);

    }catch(error:any){
        throw new Error (`Error Adding comment to thread : ${error.message}`);
    }
}