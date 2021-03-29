export const firebaseLooper = (dataDB) => {
    const data = [];
    dataDB.forEach((item) => {
        data.push({
            ...item.val(),
            id: item.key
        })
    });

    return data;
}


export const reverseArray = (arr) => {
    const reversedArr = [];

    for(let i = arr.length - 1; i >= 0; i--) {
        reversedArr.push(arr[i]);
    }

    return reversedArr;
}


export const validate = (element) => {
    let error = [true, ''];

    if(element.validation.email) {
        const valid = /\S+@\S+\.\S+/.test(element.value);
        const message = `${!valid ? 'Must be a valid email' : null}`;
        error = !valid ? [valid, message]: error;        
    }

    if(element.validation.required) {
        const valid = element.value.trim() !== '';
        const message = `${!valid ? 'This field is required' : null}`;

        error = !valid ? [valid, message]: error;
    }

    return error;
}