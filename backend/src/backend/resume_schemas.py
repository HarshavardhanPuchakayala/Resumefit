from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

ShortText = Annotated[str, StringConstraints(max_length=200)]
Bullet = Annotated[str, StringConstraints(max_length=400)]


class Contact(BaseModel):
    full_name: str = Field(default="", max_length=100)
    phone: str = Field(default="", max_length=20)
    email: str = Field(default="", max_length=255)
    location: str = Field(default="", max_length=100)
    linkedin: str = Field(default="", max_length=255)
    github: str = Field(default="", max_length=255)
    portfolio: str = Field(default="", max_length=255)


class SkillGroup(BaseModel):
    category: str = Field(default="", max_length=50)
    items: list[ShortText] = Field(default_factory=list, max_length=25)


class Experience(BaseModel):
    role: str = Field(default="", max_length=100)
    company: str = Field(default="", max_length=100)
    location: str = Field(default="", max_length=100)
    start_date: str = Field(default="", max_length=20)
    end_date: str = Field(default="", max_length=20)
    bullets: list[Bullet] = Field(default_factory=list, max_length=12)


class Project(BaseModel):
    name: str = Field(default="", max_length=150)
    start_date: str = Field(default="", max_length=20)
    end_date: str = Field(default="", max_length=20)
    tech_stack: list[ShortText] = Field(default_factory=list, max_length=20)
    bullets: list[Bullet] = Field(default_factory=list, max_length=12)


class Education(BaseModel):
    degree: str = Field(default="", max_length=150)
    institution: str = Field(default="", max_length=150)
    location: str = Field(default="", max_length=100)
    start_year: str = Field(default="", max_length=10)
    end_year: str = Field(default="", max_length=10)


class ResumeContent(BaseModel):
    headline: str = Field(default="", max_length=100)
    summary: str = Field(default="", max_length=800)
    skills: list[SkillGroup] = Field(default_factory=list, max_length=12)
    experience: list[Experience] = Field(default_factory=list, max_length=10)
    projects: list[Project] = Field(default_factory=list, max_length=10)
    education: list[Education] = Field(default_factory=list, max_length=5)


class ResumeData(BaseModel):
    contact: Contact = Field(default_factory=Contact)
    content: ResumeContent = Field(default_factory=ResumeContent)