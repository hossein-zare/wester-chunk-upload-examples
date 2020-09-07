class Chunk {
    constructor(props) {
        this.name = props.name;
        this.size = props.size;
        this.url = props.url;

        this.totalNumber = 0;
        this.start = 0;
        this.file = {};
        this.identity = this.generateRandomString();
        this.codes = [400, 404, 415, 500, 501];
    }

    setFile(file) {
        this.file = file;
        this.setTotalNumber();
    }

    setTotalNumber() {
        const total = Math.ceil(this.file.size / this.size);
        
        this.totalNumber = total > 0 ? total : 1;
    }

    getNumber() {
        return (this.start / this.size) + 1;
    }

    generateRandomString(length = 32) {
        return [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join('');
    }

    slice(start, end) {
        return this.file.slice(start, end - 1);
    }

    commit() {
        this.push(this.start, (this.start + this.size) + 1);
    }

    push(start, end) {
        const data = new FormData();
        data.append(this.name, this.slice(start, end));

        axios.post(this.url, data, {
            headers: {
                'x-chunk-number' : this.getNumber(),
                'x-chunk-total-number' : this.totalNumber,
                'x-chunk-size' : this.size,
                'x-file-name' : this.file.name,
                'x-file-size' : this.file.size,
                'x-file-identity' : this.identity
            }
        })
            .then(response => {
                this.start+= this.size;

                switch (response.status) {
                    // done
                    case 200:
                        console.log(response.data);
                    break;

                    // asking for the next chunk...
                    case 201:
                        console.log(`%${response.data.progress} uploaded...`);

                        if (this.start < this.file.size) {
                            this.commit();
                        }
                    break;
                }
            })
            .catch(error => {
                if (error.response) {
                    if (this.codes.includes(error.response.status)) {
                        console.danger(error.response.status, 'Failed to upload the chunk.')
                    } else if (error.response.status === 422) {
                        console.warn('Validation Error', error.response.data);
                    } else {
                        console.log('Re-uploading the chunk...');
                        this.commit();
                    }
                } else {
                    console.log('Re-uploading the chunk...');
                    this.commit();
                }
            });
    }
}

const upload = () => {
    const file = document.getElementById('file').files[0] ?? null;

    if (file) {
        const chunk = new Chunk({
            name: 'video', // request name
            size: 4000, // chunk size
            url: './upload.php', // destination
        });

        chunk.setFile(file);

        // Start...
        chunk.commit();
    } else {
        console.warn('Please select a file.');
    }
}
