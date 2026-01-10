# Understanding Your "Cloud" Deployment

You asked for a file to understand how your code was deployed. In our recent work, we primarily used **Ngrok** to create a temporary "cloud-like" access, while planning for a permanent **AWS** deployment. Since I (the AI) cannot directly access your AWS account, "deployment" usually refers to running scripts I provided.

Here is the breakdown of the two methods we discussed/used:

## 1. The "Temporary" Cloud (Ngrok)
**This is likely what you observed when we tested together.**

- **What we did**: We ran `ngrok http 3000` on your local computer.
- **How it works**: Ngrok creates a secure tunnel from the public internet (`https://something.ngrok.io`) directly to your laptop's `localhost:3000`.
- **Result**: People could access your site from anywhere, making it *feel* like it was on the cloud, but it was actually running on your machine.
- **Guide**: See [NGROK_GUIDE.md](file:///Users/aarya_suthar/Developer/Online-Tech-Hiring-Platform/NGROK_GUIDE.md) for enabling this again.

## 2. The "Permanent" Cloud (AWS EC2)
**This is the industry-standard way to deploy for real users.**

To keep the app running 24/7 without your laptop, we prepared a guide for AWS (Amazon Web Services).

- **The Plan**:
    1.  **Rent a Virtual Server**: Use AWS EC2 (Elastic Compute Cloud).
    2.  **Configure Firewall**: Critical for WebRTC. We need to open **UDP ports 40000-40050** so video/audio packets can flow through.
    3.  **Deploy Code**: Clone your git repository onto that server and run it.
- **Detailed Instructions**: I have created a step-by-step guide in **[AWS_DEPLOYMENT_GUIDE.md](file:///Users/aarya_suthar/Developer/Online-Tech-Hiring-Platform/AWS_DEPLOYMENT_GUIDE.md)**.

## Summary of Files
| File | Purpose |
| :--- | :--- |
| `NGROK_GUIDE.md` | How to expose your *local* server to the internet for quick testing. |
| `AWS_DEPLOYMENT_GUIDE.md` | How to push your code to a *real* AWS server for production. |
| `start_local.sh` | A helper script we wrote to detect your local IP for WiFi testing. |

If you are ready to put this on AWS permanently, follow the **AWS_DEPLOYMENT_GUIDE.md**.
