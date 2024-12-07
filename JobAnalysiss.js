class Job {
    constructor(jobData) {
        this.title = jobData.Title || 'No Title';
        this.postedTime = jobData.Posted || 'N/A';
        this.type = jobData.Type || 'N/A';
        this.level = jobData.Level || 'N/A';
        this.skill = jobData.Skill || 'N/A';
        this.detail = jobData.Detail || 'No details available';
    }

    getDetails() {
        return {
            title: this.title,
            postedTime: this.getFormattedPostedTime(),
            type: this.type,
            level: this.level,
            skill: this.skill,
            detail: this.detail
        };
    }

    getFormattedPostedTime() {
        // Converts various time formats to minutes ago
        const timeParts = this.postedTime.match(/(\d+)\s*(second|minute|hour|day|week|month)\s*ago/i);
        
        if (!timeParts) return this.postedTime;

        const value = parseInt(timeParts[1]);
        const unit = timeParts[2].toLowerCase();

        const multipliers = {
            second: 1 / 60,
            minute: 1,
            hour: 60,
            day: 60 * 24,
            week: 60 * 24 * 7,
            month: 60 * 24 * 30
        };

        return Math.round(value * multipliers[unit]);
    }
}

class JobAnalyzer {
    constructor() {
        this.jobs = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        const fileUpload = document.getElementById('fileUpload');
        const closeModal = document.getElementById('closeModal');
        
        if (fileUpload) {
            fileUpload.addEventListener('change', this.handleFileUpload.bind(this));
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', this.closeJobDetailsModal.bind(this));
        }
        
        // Add similar null checks for other event listeners
        const levelFilter = document.getElementById('levelFilter');
        const typeFilter = document.getElementById('typeFilter');
        const skillFilter = document.getElementById('skillFilter');
    
        if (levelFilter) {
            levelFilter.addEventListener('change', this.filterJobs.bind(this));
        }
        if (typeFilter) {
            typeFilter.addEventListener('change', this.filterJobs.bind(this));
        }
        if (skillFilter) {
            skillFilter.addEventListener('change', this.filterJobs.bind(this));
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        const errorMessage = document.getElementById('errorMessage');
        const jobListings = document.getElementById('jobListings');

        errorMessage.textContent = '';
        jobListings.innerHTML = '';

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                this.loadJobs(jsonData);
            } catch (error) {
                errorMessage.textContent = 'Error parsing JSON file. Please check the file format.';
                console.error(error);
            }
        };
        reader.readAsText(file);
    }

    loadJobs(jobsData) {
        this.jobs = jobsData.map(jobData => new Job(jobData));
        this.populateFilters();
        this.displayJobs(this.jobs);
    }

    populateFilters() {
        const levelFilter = document.getElementById('levelFilter');
        const typeFilter = document.getElementById('typeFilter');
        const skillFilter = document.getElementById('skillFilter');
    
        console.log('Skill Filter Element:', skillFilter);
    
        const levels = [...new Set(this.jobs.map(job => job.level))];
        const types = [...new Set(this.jobs.map(job => job.type))];
        
        const skills = [...new Set(
            this.jobs
                .map(job => job.skill)
                .filter(skill => skill !== 'N/A')
        )];
    
        console.log('Extracted Skills:', skills);
    
        this.populateDropdown(levelFilter, levels);
        this.populateDropdown(typeFilter, types);
        this.populateDropdown(skillFilter, skills);
    }
    
    populateDropdown(selectElement, options) {
        if (!selectElement) {
            console.error('Select element is null', selectElement);
            return;
        }
    
        // Keep the first "All" option
        const defaultOption = selectElement.options[0];
        selectElement.innerHTML = '';
        selectElement.appendChild(defaultOption);
    
        console.log('Populating dropdown with options:', options);
    
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }

    filterJobs() {
        const levelFilter = document.getElementById('levelFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const skillFilter = document.getElementById('skillFilter').value;
    
        const filteredJobs = this.jobs.filter(job => {
            const matchLevel = levelFilter === '' || job.level === levelFilter;
            const matchType = typeFilter === '' || job.type === typeFilter;
            
            // More flexible skill matching
            const matchSkill = skillFilter === '' || 
                // Exact match
                job.skill === skillFilter || 
                // Partial match (remove 'Jobs' suffix for more flexible matching)
                job.skill.replace(' Jobs', '').includes(skillFilter.replace(' Jobs', ''));
    
            return matchLevel && matchType && matchSkill;
        });
    
        this.displayJobs(filteredJobs);
    }

    sortJobs() {
        const titleSort = document.getElementById('sortTitle').value;
        const timeSort = document.getElementById('sortTime').value;

        let sortedJobs = [...this.jobs];

        if (titleSort === 'asc') {
            sortedJobs.sort((a, b) => a.title.localeCompare(b.title));
        } else if (titleSort === 'desc') {
            sortedJobs.sort((a, b) => b.title.localeCompare(a.title));
        }

        if (timeSort === 'newest') {
            sortedJobs.sort((a, b) => b.getFormattedPostedTime() - a.getFormattedPostedTime());
        } else if (timeSort === 'oldest') {
            sortedJobs.sort((a, b) => a.getFormattedPostedTime() - b.getFormattedPostedTime());
        }

        this.displayJobs(sortedJobs);
    }

    displayJobs(jobs) {
        const jobListings = document.getElementById('jobListings');
        jobListings.innerHTML = '';
    
        if (jobs.length === 0) {
            // Create and display a "No jobs available" message
            const noJobsMessage = document.createElement('div');
            noJobsMessage.classList.add('no-jobs-message');
            noJobsMessage.innerHTML = `
                <p>No jobs available matching your current filters.</p>
                <p>Try adjusting your search criteria or uploading a different job file.</p>
            `;
            jobListings.appendChild(noJobsMessage);
            return;
        }
    
        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.classList.add('job-card');
            jobCard.innerHTML = `
                <h3>${job.title}</h3>
                <p>Posted: ${job.postedTime}</p>
                <p>Type: ${job.type} | Level: ${job.level}</p>
            `;
            jobCard.addEventListener('click', () => this.showJobDetails(job));
            jobListings.appendChild(jobCard);
        });
    }

    showJobDetails(job) {
        const details = job.getDetails();
        const jobDetailsModal = document.getElementById('jobDetailsModal');
        const jobDetailsContent = document.getElementById('jobDetailsContent');

        jobDetailsContent.innerHTML = `
            <h2>${details.title}</h2>
            <p><strong>Posted:</strong> ${details.postedTime} minutes ago</p>
            <p><strong>Type:</strong> ${details.type}</p>
            <p><strong>Level:</strong> ${details.level}</p>
            <p><strong>Skills:</strong> ${details.skill}</p>
            <p><strong>Details:</strong> ${details.detail}</p>
        `;

        jobDetailsModal.style.display = 'block';
    }

    closeJobDetailsModal() {
        const jobDetailsModal = document.getElementById('jobDetailsModal');
        jobDetailsModal.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JobAnalyzer();
});