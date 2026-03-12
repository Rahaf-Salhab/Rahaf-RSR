import axios from 'axios';
import React, { useEffect } from 'react'
import { useState } from 'react'

export default function UseFetch(url) {
    const [data, setData] = useState([]);
    const [isLoader , setIsLoader] = useState(true);
    const [error , setError] = useState(null);
    const getData = async()=>{
        try{
            const response = await axios.get(url);
            setData(response.data);
        }
        catch(err){
            setError(err)
        }finally{
            setIsLoader(false)
        }
    }
          useEffect(()=>{
            getData();
          } , []);
            return {data ,isLoader ,error }

}
